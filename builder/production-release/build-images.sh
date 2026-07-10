#!/usr/bin/env sh
set -eu

SCRIPT_PATH=$0
case "$SCRIPT_PATH" in
    */*) SCRIPT_DIR=${SCRIPT_PATH%/*} ;;
    *) SCRIPT_DIR=. ;;
esac
SCRIPT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
IMAGE_PREFIX=${IMAGE_PREFIX:-}
IMAGE_TAG=${IMAGE_TAG:-latest}
CONFIG_SERVER_IMAGE=${CONFIG_SERVER_IMAGE:-}
PUSH_IMAGES=${PUSH_IMAGES:-0}
PUSH_EXTERNAL_IMAGES=${PUSH_EXTERNAL_IMAGES:-0}
PULL_EXTERNAL_IMAGES=${PULL_EXTERNAL_IMAGES:-1}
SKIP_GRADLE_BUILD=${SKIP_GRADLE_BUILD:-0}
SKIP_GIT_PULL=${SKIP_GIT_PULL:-0}
GIT_PULL_MODE=${GIT_PULL_MODE:-ff-only}
export BUILDKIT_PROGRESS=${BUILDKIT_PROGRESS:-plain}
export DOCKER_CLI_HINTS=${DOCKER_CLI_HINTS:-false}

case "$IMAGE_PREFIX" in
    ""|*/) ;;
    *) IMAGE_PREFIX="${IMAGE_PREFIX}/" ;;
esac

GRADLE_WRAPPER="$REPO_ROOT/gradlew"
if [ ! -x "$GRADLE_WRAPPER" ]; then
    if [ -f "$REPO_ROOT/gradlew" ]; then
        GRADLE_WRAPPER="$REPO_ROOT/gradlew"
    else
        echo "Could not find a Gradle wrapper in $REPO_ROOT." >&2
        exit 1
    fi
fi

APP_IMAGE_SERVICES="
api-gateway
user-service
idea-service
ai-service
chat-service
email-service
novafront
"

LOCAL_IMAGE_SERVICES="
$APP_IMAGE_SERVICES
config-server
"

EXTERNAL_IMAGE_SERVICES="
postgres
rabbitmq
mailpit
eureka
"

FULL_IMAGE_SERVICES="
$APP_IMAGE_SERVICES
config-server
$EXTERNAL_IMAGE_SERVICES
"

usage() {
    cat <<EOF
Usage:
  sh build-images.sh [service...]

Without parameters, builds/pulls every production release image:
  api-gateway user-service idea-service ai-service chat-service email-service novafront config-server postgres rabbitmq mailpit eureka

Examples:
  sh build-images.sh user-service
  sh build-images.sh user-service idea-service

Environment:
  IMAGE_PREFIX=registry.example.com/novaflow
  IMAGE_TAG=2026.07.10
  PUSH_IMAGES=1
  PULL_EXTERNAL_IMAGES=0
EOF
}

list_contains() {
    needle=$1
    list=$2

    for item in $list; do
        [ "$item" = "$needle" ] && return 0
    done

    return 1
}

add_selected_service() {
    service=$1

    if ! list_contains "$service" "$SELECTED_SERVICES"; then
        SELECTED_SERVICES="$SELECTED_SERVICES $service"
    fi
}

validate_service() {
    service=$1

    if list_contains "$service" "$FULL_IMAGE_SERVICES"; then
        return 0
    fi

    echo "Unknown service '$service'." >&2
    echo "Valid services: api-gateway user-service idea-service ai-service chat-service email-service novafront config-server postgres rabbitmq mailpit eureka" >&2
    exit 1
}

is_local_image_service() {
    list_contains "$1" "$LOCAL_IMAGE_SERVICES"
}

is_external_image_service() {
    list_contains "$1" "$EXTERNAL_IMAGE_SERVICES"
}

external_source_image() {
    case "$1" in
        postgres) printf '%s' "${POSTGRES_IMAGE:-postgres:15}" ;;
        rabbitmq) printf '%s' "${RABBITMQ_IMAGE:-rabbitmq:3.13-management}" ;;
        mailpit) printf '%s' "${MAILPIT_IMAGE:-axllent/mailpit:v1.30.1}" ;;
        eureka) printf '%s' "${EUREKA_IMAGE:-steeltoeoss/eureka-server}" ;;
        *)
            echo "No external image mapping exists for '$1'." >&2
            exit 1
            ;;
    esac
}

local_source_image() {
    case "$1" in
        config-server) printf '%s' "config-server:latest" ;;
        *) printf '%s' "$1:latest" ;;
    esac
}

local_target_image() {
    case "$1" in
        config-server)
            if [ -n "$CONFIG_SERVER_IMAGE" ]; then
                printf '%s' "$CONFIG_SERVER_IMAGE"
            else
                printf '%s' "${IMAGE_PREFIX}config-server:${IMAGE_TAG}"
            fi
            ;;
        *) printf '%s' "${IMAGE_PREFIX}$1:${IMAGE_TAG}" ;;
    esac
}

external_target_image() {
    printf '%s' "${IMAGE_PREFIX}$1:${IMAGE_TAG}"
}

run_checked() {
    echo
    echo "> $*"
    "$@"
}

run_gradle() {
    echo
    echo "> $GRADLE_WRAPPER $*"
    (cd "$REPO_ROOT" && "$GRADLE_WRAPPER" "$@")
}

git_pull() {
    if [ "$SKIP_GIT_PULL" = "1" ] || [ "$GIT_PULL_MODE" = "none" ] || [ "$GIT_PULL_MODE" = "None" ]; then
        echo "Skipping git pull."
        return 0
    fi

    case "$GIT_PULL_MODE" in
        ff-only|FastForwardOnly)
            echo
            echo "> git pull --ff-only"
            (cd "$REPO_ROOT" && git pull --ff-only)
            ;;
        rebase|Rebase)
            echo
            echo "> git pull --rebase --autostash"
            (cd "$REPO_ROOT" && git pull --rebase --autostash)
            ;;
        reset|Reset)
            echo "Resetting this checkout to its upstream branch. Local tracked changes will be discarded."
            echo
            echo "> git fetch --prune"
            (cd "$REPO_ROOT" && git fetch --prune)
            echo
            echo "> git reset --hard '@{u}'"
            (cd "$REPO_ROOT" && git reset --hard '@{u}')
            ;;
        *)
            echo "Unknown GIT_PULL_MODE '$GIT_PULL_MODE'. Use ff-only, rebase, reset, or none." >&2
            exit 1
            ;;
    esac
}

build_local_image() {
    service=$1

    if [ "$service" = "config-server" ]; then
        run_gradle configServerImage
    else
        run_gradle serviceImage "-Pservice=$service"
    fi

    source_image=$(local_source_image "$service")
    target_image=$(local_target_image "$service")

    if [ "$target_image" != "$source_image" ]; then
        run_checked docker tag "$source_image" "$target_image"
    fi

    if [ "$PUSH_IMAGES" = "1" ]; then
        run_checked docker push "$target_image"
    fi
}

pull_external_image() {
    service=$1
    source_image=$(external_source_image "$service")

    if [ "$PULL_EXTERNAL_IMAGES" = "1" ]; then
        run_checked docker pull "$source_image"
    else
        echo "Skipping pull for external image '$source_image'."
    fi

    if [ "$PUSH_IMAGES" = "1" ] && [ "$PUSH_EXTERNAL_IMAGES" = "1" ]; then
        if [ -z "$IMAGE_PREFIX" ]; then
            echo "Skipping mirrored push for '$source_image' because IMAGE_PREFIX is empty."
            return 0
        fi

        target_image=$(external_target_image "$service")
        run_checked docker tag "$source_image" "$target_image"
        run_checked docker push "$target_image"
        echo "Set the matching compose image env var to '$target_image' when deploying this mirrored image."
    fi
}

SELECTED_SERVICES=""
FULL_RELEASE=0

if [ "$#" -eq 0 ]; then
    FULL_RELEASE=1
    for service in $FULL_IMAGE_SERVICES; do
        add_selected_service "$service"
    done
else
    for service in "$@"; do
        case "$service" in
            -h|--help)
                usage
                exit 0
                ;;
        esac
        validate_service "$service"
        add_selected_service "$service"
    done
fi

echo "Updating repository..."
git_pull

if [ "$SKIP_GRADLE_BUILD" != "1" ] && [ "$FULL_RELEASE" = "1" ]; then
    echo "Running Gradle buildAll before building full release images..."
    run_gradle buildAll
fi

for service in $SELECTED_SERVICES; do
    if is_local_image_service "$service"; then
        build_local_image "$service"
    elif is_external_image_service "$service"; then
        pull_external_image "$service"
    fi
done

echo
echo "Production image preparation complete for:$SELECTED_SERVICES"
echo "Image tag: $IMAGE_TAG"

if [ "$PUSH_IMAGES" = "1" ]; then
    echo "Local NovaFlow images were pushed."
else
    echo "Local NovaFlow images were not pushed. Set PUSH_IMAGES=1 when the pipeline should publish them."
fi
