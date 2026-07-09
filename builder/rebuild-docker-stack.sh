#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
COMPOSE_FILE=${COMPOSE_FILE:-"$SCRIPT_DIR/docker-compose.yml"}
ENV_FILE=${ENV_FILE:-}
SKIP_GIT_PULL=${SKIP_GIT_PULL:-0}
GIT_PULL_MODE=${GIT_PULL_MODE:-ff-only}
export BUILDKIT_PROGRESS=${BUILDKIT_PROGRESS:-plain}
export COMPOSE_ANSI=${COMPOSE_ANSI:-never}
export COMPOSE_PROGRESS=${COMPOSE_PROGRESS:-plain}
export COMPOSE_MENU=${COMPOSE_MENU:-false}
export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-novaflow}
export DOCKER_CLI_HINTS=${DOCKER_CLI_HINTS:-false}

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Could not find Docker Compose file: $COMPOSE_FILE" >&2
    exit 1
fi

if [ -z "$ENV_FILE" ]; then
    if [ -f "$REPO_ROOT/.env" ]; then
        ENV_FILE="$REPO_ROOT/.env"
    elif [ -f "$SCRIPT_DIR/.env" ]; then
        ENV_FILE="$SCRIPT_DIR/.env"
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

GRADLE_WRAPPER="$REPO_ROOT/gradlew"
if [ ! -x "$GRADLE_WRAPPER" ]; then
    if [ -f "$REPO_ROOT/gradlew.bat" ]; then
        GRADLE_WRAPPER="$REPO_ROOT/gradlew.bat"
    else
        echo "Could not find a Gradle wrapper in $REPO_ROOT." >&2
        exit 1
    fi
fi

compose_stack() {
    if [ -n "$ENV_FILE" ]; then
        compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
    else
        compose -f "$COMPOSE_FILE" "$@"
    fi
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

echo "Running Gradle buildAll..."
run_gradle buildAll

echo
echo "Building application Docker images..."

for service in $IMAGE_SERVICES; do
    run_gradle serviceImage "-Pservice=$service"
done

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

echo
echo "Stopping containers..."
compose_stack stop

echo
echo "Removing stopped containers..."
compose_stack rm -f

echo
echo "Creating containers from the new images..."
compose_stack up -d --no-build --force-recreate --remove-orphans

echo
echo "Docker stack recreated."
