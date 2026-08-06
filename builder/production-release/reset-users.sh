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
SSM_ENV_PATH=${SSM_ENV_PATH:-}
SSM_ENV_REGION=${SSM_ENV_REGION:-${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}}
CONFIRMED=${CONFIRM_RESET_USERS:-}
RESET_USERS_DATABASE=${RESET_USERS_DATABASE:-user_service_db}
USE_EXTERNAL_POSTGRES=${USE_EXTERNAL_POSTGRES:-}

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
  SSM_ENV_PATH=/novaflow/production/env
  SSM_ENV_REGION=us-east-1
  CONFIRM_RESET_USERS=yes
  RESET_USERS_DATABASE=user_service_db
  USE_EXTERNAL_POSTGRES=1
  DB_HOST=novaflow-postgres.xxxxxx.us-east-1.rds.amazonaws.com
  DB_PORT=5432
  DB_USERNAME=novaflow_admin
  DB_PASSWORD=required-for-external-postgres
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

RENDERED_ENV_FILE=""

cleanup_rendered_env_file() {
    if [ -n "$RENDERED_ENV_FILE" ]; then
        rm -f "$RENDERED_ENV_FILE"
    fi
}
trap cleanup_rendered_env_file EXIT HUP INT TERM

if [ -n "$SSM_ENV_PATH" ]; then
    if [ -n "$ENV_FILE" ]; then
        echo "Both SSM_ENV_PATH and ENV_FILE are set. Refusing to choose between them." >&2
        exit 1
    fi

    RENDERED_ENV_FILE=$(mktemp)
    SSM_ENV_PATH="$SSM_ENV_PATH" \
        SSM_ENV_REGION="$SSM_ENV_REGION" \
        OUTPUT_ENV_FILE="$RENDERED_ENV_FILE" \
        sh "$SCRIPT_DIR/render-env-from-ssm.sh"
    ENV_FILE="$RENDERED_ENV_FILE"
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

if [ -z "$USE_EXTERNAL_POSTGRES" ]; then
    USE_EXTERNAL_POSTGRES=$(dotenv_get USE_EXTERNAL_POSTGRES || true)
fi

USE_EXTERNAL_POSTGRES=${USE_EXTERNAL_POSTGRES:-0}
DB_HOST=$(env_or_default DB_HOST postgres)
DB_PORT=$(env_or_default DB_PORT 5432)
POSTGRES_USER_VALUE=$(env_or_default POSTGRES_USER sa)
POSTGRES_PASSWORD_VALUE=$(env_or_default POSTGRES_PASSWORD "")
DB_USERNAME=$(env_or_default DB_USERNAME "$POSTGRES_USER_VALUE")
DB_PASSWORD=$(env_or_default DB_PASSWORD "$POSTGRES_PASSWORD_VALUE")

uses_external_postgres() {
    case "$USE_EXTERNAL_POSTGRES" in
        1|true|TRUE|True|yes|YES|Yes) return 0 ;;
        *) return 1 ;;
    esac
}

if ! uses_external_postgres; then
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
fi

compose_stack() {
    if [ -n "$ENV_FILE" ]; then
        compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
    else
        compose -f "$COMPOSE_FILE" "$@"
    fi
}

run_reset_sql() {
    if uses_external_postgres; then
        if ! command -v psql >/dev/null 2>&1; then
            echo "psql is required when USE_EXTERNAL_POSTGRES=1." >&2
            echo "Install postgresql-client on EC2, then rerun this script." >&2
            exit 1
        fi

        if [ -z "$DB_PASSWORD" ]; then
            echo "DB_PASSWORD is required when USE_EXTERNAL_POSTGRES=1." >&2
            exit 2
        fi

        PGPASSWORD=$DB_PASSWORD psql -v ON_ERROR_STOP=1 \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USERNAME" \
            -d "$RESET_USERS_DATABASE"
    else
        compose_stack exec -T -e RESET_USERS_DATABASE="$RESET_USERS_DATABASE" postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$RESET_USERS_DATABASE"'
    fi
}

echo "Resetting NovaFlow users in PostgreSQL database '$RESET_USERS_DATABASE'..."
if uses_external_postgres; then
    echo "Using external PostgreSQL at $DB_HOST:$DB_PORT."
fi

run_reset_sql <<'SQL'
\echo 'Users before reset:'
SELECT count(*) AS app_user_count FROM public.app_user;

TRUNCATE TABLE public.app_user RESTART IDENTITY CASCADE;

\echo 'Users after reset:'
SELECT count(*) AS app_user_count FROM public.app_user;
SQL
echo "User reset complete."
