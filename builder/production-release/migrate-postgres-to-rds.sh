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
CONFIRMED=${CONFIRM_MIGRATE_POSTGRES_TO_RDS:-}
MIGRATE_STOP_APP_SERVICES=${MIGRATE_STOP_APP_SERVICES:-1}
MIGRATE_BACKUP_RDS=${MIGRATE_BACKUP_RDS:-1}
MIGRATE_BACKUP_DIR=${MIGRATE_BACKUP_DIR:-"$REPO_ROOT/backups/postgres-migration-$(date -u +%Y%m%d-%H%M%S)"}
USE_EXTERNAL_POSTGRES=${USE_EXTERNAL_POSTGRES:-}

APP_SERVICES="novafront api-gateway email-service chat-service ai-service idea-service user-service config-server"

usage() {
    cat <<EOF
Usage:
  SSM_ENV_PATH=/novaflow/production/env sh migrate-postgres-to-rds.sh --yes

Dumps NovaFlow databases from the Docker postgres container and restores them
into the configured external PostgreSQL database, such as Amazon RDS.

The restore drops and recreates the target public schema in each RDS database.
Existing RDS databases are backed up first by default.

Environment overrides:
  COMPOSE_FILE=/path/to/docker-compose.production.yml
  ENV_FILE=/path/to/.env
  SSM_ENV_PATH=/novaflow/production/env
  SSM_ENV_REGION=us-east-1
  CONFIRM_MIGRATE_POSTGRES_TO_RDS=yes
  MIGRATE_DATABASES="user_service_db idea_service_db ai_service_db"
  MIGRATE_BACKUP_DIR=/path/to/backups
  MIGRATE_BACKUP_RDS=1
  MIGRATE_STOP_APP_SERVICES=1
  USE_EXTERNAL_POSTGRES=1
  DB_HOST=novaflow-postgres.xxxxxx.us-east-1.rds.amazonaws.com
  DB_PORT=5432
  DB_USERNAME=novaflow_admin
  DB_PASSWORD=required-for-rds
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
    echo "Refusing to migrate PostgreSQL data without --yes or CONFIRM_MIGRATE_POSTGRES_TO_RDS=yes." >&2
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

uses_external_postgres() {
    case "$USE_EXTERNAL_POSTGRES" in
        1|true|TRUE|True|yes|YES|Yes) return 0 ;;
        *) return 1 ;;
    esac
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "$1 is required." >&2
        exit 1
    fi
}

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

if [ -z "$USE_EXTERNAL_POSTGRES" ]; then
    USE_EXTERNAL_POSTGRES=$(dotenv_get USE_EXTERNAL_POSTGRES || true)
fi
USE_EXTERNAL_POSTGRES=${USE_EXTERNAL_POSTGRES:-0}

if ! uses_external_postgres; then
    echo "USE_EXTERNAL_POSTGRES must be enabled before migrating to RDS." >&2
    exit 2
fi

DB_HOST=$(env_or_default DB_HOST postgres)
DB_PORT=$(env_or_default DB_PORT 5432)
POSTGRES_USER_VALUE=$(env_or_default POSTGRES_USER sa)
POSTGRES_PASSWORD_VALUE=$(env_or_default POSTGRES_PASSWORD "")
DB_USERNAME=$(env_or_default DB_USERNAME "$POSTGRES_USER_VALUE")
DB_PASSWORD=$(env_or_default DB_PASSWORD "$POSTGRES_PASSWORD_VALUE")
USER_SERVICE_DB_NAME=$(env_or_default USER_SERVICE_DB_NAME user_service_db)
IDEA_SERVICE_DB_NAME=$(env_or_default IDEA_SERVICE_DB_NAME idea_service_db)
AI_SERVICE_DB_NAME=$(env_or_default AI_SERVICE_DB_NAME ai_service_db)
MIGRATE_DATABASES=${MIGRATE_DATABASES:-"$USER_SERVICE_DB_NAME $IDEA_SERVICE_DB_NAME $AI_SERVICE_DB_NAME"}

if [ -z "$DB_PASSWORD" ]; then
    echo "DB_PASSWORD is required for the target RDS restore." >&2
    exit 2
fi

require_command docker
require_command psql
require_command pg_dump
require_command pg_restore

postgres_container_id=$(compose_stack ps -q postgres || true)
if [ -z "$postgres_container_id" ]; then
    echo "Could not find the Docker postgres source container for this compose project." >&2
    exit 1
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$postgres_container_id")" != "true" ]; then
    echo "Docker postgres source container is not running: $postgres_container_id" >&2
    exit 1
fi

mkdir -p "$MIGRATE_BACKUP_DIR"
echo "Migration backup directory: $MIGRATE_BACKUP_DIR"
echo "Target RDS endpoint: $DB_HOST:$DB_PORT"
echo "Databases: $MIGRATE_DATABASES"

stop_app_services() {
    case "$MIGRATE_STOP_APP_SERVICES" in
        1|true|TRUE|True|yes|YES|Yes)
            echo "Stopping app services so the target RDS databases stay still during restore..."
            compose_stack stop $APP_SERVICES
            ;;
        *)
            echo "MIGRATE_STOP_APP_SERVICES is disabled. Continuing without stopping app services."
            ;;
    esac
}

start_app_services() {
    case "$MIGRATE_STOP_APP_SERVICES" in
        1|true|TRUE|True|yes|YES|Yes)
            echo "Starting app services with deploy-stack.sh..."
            ENV_FILE="$ENV_FILE" \
                SSM_ENV_PATH= \
                SSM_ENV_REGION= \
                SKIP_GIT_PULL=1 \
                GIT_PULL_MODE=none \
                SKIP_PULL=1 \
                PULL_IMAGES=0 \
                sh "$SCRIPT_DIR/deploy-stack.sh" config-server user-service idea-service ai-service chat-service email-service api-gateway novafront
            ;;
    esac
}

dump_source_database() {
    database=$1
    output_file=$2

    echo "Dumping Docker postgres database '$database'..."
    compose_stack exec -T -e SOURCE_DATABASE="$database" postgres sh -lc \
        'pg_dump -Fc --no-owner --no-acl -U "$POSTGRES_USER" -d "$SOURCE_DATABASE"' > "$output_file"

    if [ ! -s "$output_file" ]; then
        echo "Source dump is empty: $output_file" >&2
        exit 1
    fi
}

backup_target_database() {
    database=$1
    output_file=$2

    case "$MIGRATE_BACKUP_RDS" in
        1|true|TRUE|True|yes|YES|Yes)
            echo "Backing up current RDS database '$database'..."
            PGPASSWORD=$DB_PASSWORD pg_dump -Fc --no-owner --no-acl \
                -h "$DB_HOST" \
                -p "$DB_PORT" \
                -U "$DB_USERNAME" \
                -d "$database" \
                -f "$output_file"
            ;;
        *)
            echo "Skipping RDS backup for '$database'."
            ;;
    esac
}

reset_target_schema() {
    database=$1

    echo "Resetting public schema in RDS database '$database'..."
    PGPASSWORD=$DB_PASSWORD psql -v ON_ERROR_STOP=1 \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$database" <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public AUTHORIZATION CURRENT_USER;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO public;
SQL
}

restore_target_database() {
    database=$1
    input_file=$2

    echo "Restoring '$database' into RDS..."
    PGPASSWORD=$DB_PASSWORD pg_restore --exit-on-error --no-owner --no-acl \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$database" \
        "$input_file"
}

target_table_count() {
    database=$1

    PGPASSWORD=$DB_PASSWORD psql -At \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$database" \
        -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
}

stop_app_services

for database in $MIGRATE_DATABASES; do
    source_dump="$MIGRATE_BACKUP_DIR/docker-$database.dump"
    rds_backup="$MIGRATE_BACKUP_DIR/rds-before-$database.dump"

    dump_source_database "$database" "$source_dump"
    backup_target_database "$database" "$rds_backup"
    reset_target_schema "$database"
    restore_target_database "$database" "$source_dump"

    echo "RDS '$database' now has $(target_table_count "$database") public tables."
done

start_app_services

echo "PostgreSQL migration to RDS complete."
echo "Backup files are in: $MIGRATE_BACKUP_DIR"
