#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
IMAGE_PREFIX=${IMAGE_PREFIX:-}
IMAGE_TAG=${IMAGE_TAG:-latest}
PUSH_IMAGES=${PUSH_IMAGES:-0}
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
    if [ -f "$REPO_ROOT/gradlew.bat" ]; then
        GRADLE_WRAPPER="$REPO_ROOT/gradlew.bat"
    else
        echo "Could not find a Gradle wrapper in $REPO_ROOT." >&2
        exit 1
    fi
fi

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

IMAGE_SERVICES="
api-gateway
user-service
idea-service
ai-service
chat-service
email-service
novafront
"

echo "Updating repository..."
git_pull

if [ "$SKIP_GRADLE_BUILD" != "1" ]; then
    echo "Running Gradle buildAll..."
    run_gradle buildAll
fi

for service in $IMAGE_SERVICES; do
    run_gradle serviceImage "-Pservice=$service"

    source_image="${service}:latest"
    target_image="${IMAGE_PREFIX}${service}:${IMAGE_TAG}"

    if [ "$target_image" != "$source_image" ]; then
        run_checked docker tag "$source_image" "$target_image"
    fi

    if [ "$PUSH_IMAGES" = "1" ]; then
        run_checked docker push "$target_image"
    fi
done

echo
echo "Built application images with tag '$IMAGE_TAG'."
if [ "$PUSH_IMAGES" = "1" ]; then
    echo "Pushed application images."
else
    echo "Images were not pushed. Set PUSH_IMAGES=1 when the pipeline should publish them."
fi
