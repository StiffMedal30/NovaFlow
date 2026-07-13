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
CONFIRMED=${CONFIRM_RESET_USERS:-}
RESET_USERS_DATABASE=${RESET_USERS_DATABASE:-user_service_db}

usage() {
    cat <<EOF
Usage:
  sh reset-users.sh --yes

Deletes all NovaFlow users from the configured PostgreSQL database and resets
the app_user identity sequence. Dependent rows such as activation and password
reset tokens are removed by PostgreSQL CASCADE.

Environment overrides:
  COMPOSE_FILE=/path/to/docker-compose.production.yml
  ENV_FILE=/path/to/.env
  CONFIRM_RESET_USERS=yes
  RESET_USERS_DATABASE=user_service_db
EOF
}

for arg in "$@"; do
    case "$arg" in
        --yes)
            CONFIRMED=yes
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown argument '$arg'." >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [ "$CONFIRMED" != "yes" ]; then
    echo "Refusing to reset users without --yes or CONFIRM_RESET_USERS=yes." >&2
    usage >&2
    exit 2
fi

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

compose_stack() {
    if [ -n "$ENV_FILE" ]; then
        compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
    else
        compose -f "$COMPOSE_FILE" "$@"
    fi
}

echo "Resetting NovaFlow users in PostgreSQL database '$RESET_USERS_DATABASE'..."
compose_stack exec -T -e RESET_USERS_DATABASE="$RESET_USERS_DATABASE" postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$RESET_USERS_DATABASE"' <<'SQL'
\echo 'Users before reset:'
SELECT count(*) AS app_user_count FROM public.app_user;

TRUNCATE TABLE public.app_user RESTART IDENTITY CASCADE;

\echo 'Users after reset:'
SELECT count(*) AS app_user_count FROM public.app_user;
SQL
echo "User reset complete."
