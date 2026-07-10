#!/usr/bin/env sh
set -eu

SCRIPT_PATH=$0
case "$SCRIPT_PATH" in
    */*) SCRIPT_DIR=${SCRIPT_PATH%/*} ;;
    *) SCRIPT_DIR=. ;;
esac
SCRIPT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
COMPOSE_FILE=${COMPOSE_FILE:-"$SCRIPT_DIR/docker-compose.production.yml"}
ENV_FILE=${ENV_FILE:-}
IMAGE_PREFIX=${IMAGE_PREFIX:-}
IMAGE_TAG=${IMAGE_TAG:-}
CONFIG_SERVER_IMAGE=${CONFIG_SERVER_IMAGE:-}
WAIT_TIMEOUT=${WAIT_TIMEOUT:-180}
PULL_IMAGES=${PULL_IMAGES:-auto}
SKIP_PULL=${SKIP_PULL:-0}
SKIP_GIT_PULL=${SKIP_GIT_PULL:-0}
GIT_PULL_MODE=${GIT_PULL_MODE:-ff-only}
export COMPOSE_ANSI=${COMPOSE_ANSI:-never}
export COMPOSE_PROGRESS=${COMPOSE_PROGRESS:-plain}
export COMPOSE_MENU=${COMPOSE_MENU:-false}
export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-novaflow-production}
export DOCKER_CLI_HINTS=${DOCKER_CLI_HINTS:-false}

APP_RELEASE_SERVICES="
api-gateway
user-service
idea-service
ai-service
chat-service
email-service
novafront
"

INFRA_RELEASE_SERVICES="
postgres
rabbitmq
mailpit
eureka
config-server
"

ROLLING_RELEASE_ORDER="
postgres
rabbitmq
mailpit
eureka
config-server
user-service
idea-service
ai-service
chat-service
email-service
api-gateway
novafront
"

usage() {
    cat <<EOF
Usage:
  sh deploy-stack.sh [service...]

Without parameters, rolls the full production release set:
  postgres rabbitmq mailpit eureka config-server user-service idea-service ai-service chat-service email-service api-gateway novafront

Examples:
  sh deploy-stack.sh user-service
  sh deploy-stack.sh user-service idea-service
  sh deploy-stack.sh postgres rabbitmq mailpit eureka config-server
EOF
}

for arg in "$@"; do
    case "$arg" in
        -h|--help)
            usage
            exit 0
            ;;
    esac
done

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Could not find Docker Compose file: $COMPOSE_FILE" >&2
    exit 1
fi

if [ -z "$ENV_FILE" ]; then
    if [ -f "$SCRIPT_DIR/.env" ]; then
        ENV_FILE="$SCRIPT_DIR/.env"
    elif [ -f "$SCRIPT_DIR/../.env" ]; then
        ENV_FILE="$SCRIPT_DIR/../.env"
    elif [ -f "$REPO_ROOT/.env" ]; then
        ENV_FILE="$REPO_ROOT/.env"
    fi
fi

if [ -n "$ENV_FILE" ]; then
    if [ ! -f "$ENV_FILE" ]; then
        echo "Could not find env file: $ENV_FILE" >&2
        exit 1
    fi
    echo "Using env file: $ENV_FILE"
else
    echo "No .env file found. Docker Compose will use the current process environment."
fi

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

    if list_contains "$service" "$APP_RELEASE_SERVICES" || list_contains "$service" "$INFRA_RELEASE_SERVICES"; then
        return 0
    fi

    echo "Unknown service '$service'." >&2
    echo "Valid services: api-gateway user-service idea-service ai-service chat-service email-service novafront postgres rabbitmq mailpit eureka config-server" >&2
    exit 1
}

dotenv_get() {
    key=$1

    if [ -z "$ENV_FILE" ] || [ ! -f "$ENV_FILE" ]; then
        return 1
    fi

    value=$(sed -n "s/^[[:space:]]*$key[[:space:]]*=[[:space:]]*//p" "$ENV_FILE" | sed -n '1p')
    [ -n "$value" ] || return 1

    case "$value" in
        \"*\") value=$(printf '%s' "$value" | sed 's/^"//; s/"$//') ;;
        \'*\') value=$(printf '%s' "$value" | sed "s/^'//; s/'$//") ;;
    esac

    printf '%s' "$value"
}

if [ -z "$IMAGE_PREFIX" ]; then
    IMAGE_PREFIX=$(dotenv_get IMAGE_PREFIX || true)
fi

if [ -z "$IMAGE_TAG" ]; then
    IMAGE_TAG=$(dotenv_get IMAGE_TAG || true)
fi

if [ -z "$IMAGE_TAG" ]; then
    IMAGE_TAG=latest
fi

case "$IMAGE_PREFIX" in
    ""|*/) ;;
    *) IMAGE_PREFIX="${IMAGE_PREFIX}/" ;;
esac

if [ -z "$CONFIG_SERVER_IMAGE" ]; then
    CONFIG_SERVER_IMAGE=$(dotenv_get CONFIG_SERVER_IMAGE || true)
fi

if [ -z "$CONFIG_SERVER_IMAGE" ]; then
    CONFIG_SERVER_IMAGE="${IMAGE_PREFIX}config-server:${IMAGE_TAG}"
fi

export IMAGE_PREFIX IMAGE_TAG CONFIG_SERVER_IMAGE

compose_stack() {
    if [ -n "$ENV_FILE" ]; then
        compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
    else
        compose -f "$COMPOSE_FILE" "$@"
    fi
}

run_compose() {
    echo
    echo "> docker compose $*"
    compose_stack "$@"
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

env_or_default() {
    name=$1
    default_value=$2
    eval "value=\${$name:-}"
    if [ -n "$value" ]; then
        printf '%s' "$value"
    elif value=$(dotenv_get "$name" 2>/dev/null); then
        printf '%s' "$value"
    else
        printf '%s' "$default_value"
    fi
}

container_id() {
    compose_stack ps -q "$1" | sed -n '1p'
}

inspect_value() {
    docker inspect --format "$2" "$1" 2>/dev/null || true
}

http_ready() {
    url=$1

    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is not available; skipping HTTP readiness check for $url"
        return 0
    fi

    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || printf '000')

    case "$code" in
        000) return 1 ;;
        *[!0-9]*) return 1 ;;
        *) [ "$code" -lt 500 ] ;;
    esac
}

wait_service_ready() {
    service=$1
    url=$2
    end_time=$(( $(date +%s) + WAIT_TIMEOUT ))

    echo "Waiting for $service..."

    while [ "$(date +%s)" -lt "$end_time" ]; do
        id=$(container_id "$service")

        if [ -n "$id" ]; then
            status=$(inspect_value "$id" '{{.State.Status}}')
            health=$(inspect_value "$id" '{{if .State.Health}}{{.State.Health.Status}}{{end}}')

            if [ "$status" = "running" ]; then
                if [ -n "$health" ] && [ "$health" != "healthy" ]; then
                    sleep 5
                    continue
                fi

                if [ -z "$url" ] || http_ready "$url"; then
                    echo "$service is ready."
                    return 0
                fi
            fi
        fi

        sleep 5
    done

    echo "$service did not become ready within $WAIT_TIMEOUT seconds." >&2
    return 1
}

should_pull_images() {
    if [ "$SKIP_PULL" = "1" ]; then
        return 1
    fi

    if [ "$PULL_IMAGES" = "1" ]; then
        return 0
    fi

    if [ "$PULL_IMAGES" = "auto" ] && [ -n "$IMAGE_PREFIX" ]; then
        return 0
    fi

    return 1
}

service_url() {
    case "$1" in
        postgres) printf '%s' "" ;;
        rabbitmq) printf '%s' "" ;;
        mailpit) printf '%s' "$MAILPIT_URL" ;;
        eureka) printf '%s' "$EUREKA_URL" ;;
        config-server) printf '%s' "$CONFIG_SERVER_HEALTH_URL" ;;
        user-service) printf '%s' "$USER_SERVICE_URL" ;;
        idea-service) printf '%s' "$IDEA_SERVICE_URL" ;;
        ai-service) printf '%s' "$AI_SERVICE_URL" ;;
        chat-service) printf '%s' "$CHAT_SERVICE_URL" ;;
        email-service) printf '%s' "$EMAIL_SERVICE_URL" ;;
        api-gateway) printf '%s' "$API_GATEWAY_URL" ;;
        novafront) printf '%s' "$FRONTEND_URL" ;;
        *)
            echo "No readiness URL mapping exists for '$1'." >&2
            exit 1
            ;;
    esac
}

dependencies_for_service() {
    case "$1" in
        config-server) printf '%s\n' "eureka" ;;
        user-service) printf '%s\n' "postgres rabbitmq eureka config-server" ;;
        idea-service) printf '%s\n' "postgres eureka config-server" ;;
        ai-service) printf '%s\n' "postgres eureka config-server" ;;
        chat-service) printf '%s\n' "eureka config-server" ;;
        email-service) printf '%s\n' "rabbitmq mailpit eureka config-server" ;;
        api-gateway) printf '%s\n' "eureka config-server" ;;
        *) printf '%s\n' "" ;;
    esac
}

ordered_selected_services() {
    for service in $ROLLING_RELEASE_ORDER; do
        if list_contains "$service" "$SELECTED_SERVICES"; then
            printf '%s\n' "$service"
        fi
    done
}

ensure_dependency_running() {
    service=$1
    url=$(service_url "$service")

    echo "Ensuring dependency $service is running..."
    run_compose up -d --no-build "$service"
    wait_service_ready "$service" "$url"
}

release_service() {
    service=$1
    url=$(service_url "$service")

    if should_pull_images; then
        run_compose pull "$service"
    fi

    run_compose stop "$service"
    run_compose rm -f "$service"
    run_compose up -d --no-deps --no-build --force-recreate "$service"
    wait_service_ready "$service" "$url"
}

SELECTED_SERVICES=""

if [ "$#" -eq 0 ]; then
    for service in $ROLLING_RELEASE_ORDER; do
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

EUREKA_URL="http://localhost:$(env_or_default EUREKA_HOST_PORT 8761)"
MAILPIT_URL="http://localhost:$(env_or_default MAILPIT_UI_HOST_PORT 8025)"
CONFIG_SERVER_URL="http://localhost:$(env_or_default CONFIG_SERVER_HOST_PORT 7090)"
CONFIG_SERVER_HEALTH_URL="$CONFIG_SERVER_URL/actuator/health"
USER_SERVICE_URL="http://localhost:$(env_or_default USER_SERVICE_HOST_PORT 7010)/actuator/health"
IDEA_SERVICE_URL="http://localhost:$(env_or_default IDEA_SERVICE_HOST_PORT 7020)/actuator/health"
AI_SERVICE_URL="http://localhost:$(env_or_default AI_SERVICE_HOST_PORT 7030)/actuator/health"
CHAT_SERVICE_URL="http://localhost:$(env_or_default CHAT_SERVICE_HOST_PORT 8085)/actuator/health"
EMAIL_SERVICE_URL="http://localhost:$(env_or_default EMAIL_SERVICE_HOST_PORT 8050)/actuator/health"
API_GATEWAY_URL="http://localhost:$(env_or_default API_GATEWAY_HOST_PORT 8081)/actuator/health"
FRONTEND_URL="http://localhost:$(env_or_default FRONTEND_HOST_PORT 3000)"

echo "Updating repository..."
git_pull

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    compose() {
        docker compose "$@"
    }
elif command -v docker-compose >/dev/null 2>&1; then
    compose() {
        docker-compose "$@"
    }
else
    echo "Could not find 'docker compose' or 'docker-compose'." >&2
    exit 1
fi

ORDERED_SELECTED_SERVICES=$(ordered_selected_services)
ENSURED_DEPENDENCIES=""

echo "Selected production services:$ORDERED_SELECTED_SERVICES"

for service in $ORDERED_SELECTED_SERVICES; do
    for dependency in $(dependencies_for_service "$service"); do
        if ! list_contains "$dependency" "$SELECTED_SERVICES" && ! list_contains "$dependency" "$ENSURED_DEPENDENCIES"; then
            ensure_dependency_running "$dependency"
            ENSURED_DEPENDENCIES="$ENSURED_DEPENDENCIES $dependency"
        fi
    done
done

echo
echo "Rolling selected services one at a time..."
for service in $ORDERED_SELECTED_SERVICES; do
    release_service "$service"
done

echo
run_compose ps
echo
echo "Production rollout complete for:$ORDERED_SELECTED_SERVICES"
