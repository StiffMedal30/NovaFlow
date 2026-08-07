#!/usr/bin/env sh
set -eu

SCRIPT_PATH=$0
case "$SCRIPT_PATH" in
    */*) SCRIPT_DIR=${SCRIPT_PATH%/*} ;;
    *) SCRIPT_DIR=. ;;
esac
SCRIPT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

CONFIRMED=${CONFIRM_CLEANUP_EC2:-}
CLEANUP_ARCHIVE_DIR=${CLEANUP_ARCHIVE_DIR:-"$REPO_ROOT/backups/ec2-cleanup-$(date -u +%Y%m%d-%H%M%S)"}
CLEANUP_CONTAINERS=${CLEANUP_CONTAINERS:-"postgres mailpit pgadmin"}
DELETE_POSTGRES_VOLUME=${DELETE_POSTGRES_VOLUME:-0}
DISABLE_NGINX=${DISABLE_NGINX:-0}
PRUNE_DOCKER=${PRUNE_DOCKER:-1}

usage() {
    cat <<EOF
Usage:
  sh cleanup-ec2-after-aws-migration.sh --yes

Cleans production EC2 after moving runtime configuration to SSM Parameter Store,
PostgreSQL to RDS, HTTPS/proxying to ALB, and email to real SMTP.

By default this script:
  - moves old .env files into a timestamped backup directory
  - stops and removes unused postgres/mailpit/pgadmin containers
  - prunes dangling Docker images and old builder cache

It does not remove the old PostgreSQL Docker volume unless explicitly requested.

Environment overrides:
  CONFIRM_CLEANUP_EC2=yes
  CLEANUP_ARCHIVE_DIR=/path/to/archive
  CLEANUP_CONTAINERS="postgres mailpit pgadmin"
  DELETE_POSTGRES_VOLUME=1
  DISABLE_NGINX=1
  PRUNE_DOCKER=1
EOF
}

for arg in "$@"; do
    case "$arg" in
        --yes)
            CONFIRMED=yes
            ;;
        --delete-postgres-volume)
            DELETE_POSTGRES_VOLUME=1
            ;;
        --disable-nginx)
            DISABLE_NGINX=1
            ;;
        --no-prune)
            PRUNE_DOCKER=0
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
    echo "Refusing to clean EC2 without --yes or CONFIRM_CLEANUP_EC2=yes." >&2
    usage >&2
    exit 2
fi

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "$1 is required." >&2
        exit 1
    fi
}

archive_file() {
    source_file=$1

    if [ ! -f "$source_file" ]; then
        return 0
    fi

    relative_path=$source_file
    case "$relative_path" in
        "$REPO_ROOT"/*) relative_path=${relative_path#"$REPO_ROOT"/} ;;
    esac

    target_file="$CLEANUP_ARCHIVE_DIR/$relative_path"
    target_dir=${target_file%/*}

    mkdir -p "$target_dir"
    mv "$source_file" "$target_file"
    chmod 600 "$target_file" 2>/dev/null || true
    echo "Archived $relative_path -> $target_file"
}

container_exists() {
    docker inspect "$1" >/dev/null 2>&1
}

remove_container() {
    container=$1

    if ! container_exists "$container"; then
        echo "Container '$container' is already absent."
        return 0
    fi

    echo "Stopping/removing unused container '$container'..."
    docker stop "$container" >/dev/null 2>&1 || true
    docker rm "$container"
}

remove_postgres_volumes() {
    volumes=$(docker volume ls -q --filter label=com.docker.compose.project=novaflow-production | grep 'postgres_data$' || true)

    if [ -z "$volumes" ]; then
        volumes=$(docker volume ls -q | grep -E '^(novaflow-production_)?postgres_data$' || true)
    fi

    if [ -z "$volumes" ]; then
        echo "No NovaFlow postgres_data Docker volume found."
        return 0
    fi

    case "$DELETE_POSTGRES_VOLUME" in
        1|true|TRUE|True|yes|YES|Yes)
            for volume in $volumes; do
                echo "Removing PostgreSQL Docker volume '$volume'..."
                docker volume rm "$volume"
            done
            ;;
        *)
            echo "Keeping PostgreSQL Docker volume(s) as rollback backup:"
            for volume in $volumes; do
                echo "  $volume"
            done
            ;;
    esac
}

disable_nginx() {
    case "$DISABLE_NGINX" in
        1|true|TRUE|True|yes|YES|Yes)
            if command -v systemctl >/dev/null 2>&1; then
                echo "Disabling nginx because ALB now owns HTTP/HTTPS ingress..."
                sudo systemctl disable --now nginx || true
            else
                echo "systemctl is unavailable; skipping nginx disable."
            fi
            ;;
        *)
            echo "Leaving nginx as-is. Pass --disable-nginx when ALB has fully replaced it."
            ;;
    esac
}

prune_docker() {
    case "$PRUNE_DOCKER" in
        1|true|TRUE|True|yes|YES|Yes)
            echo "Pruning dangling Docker images..."
            docker image prune -f

            if docker builder prune --help >/dev/null 2>&1; then
                echo "Pruning Docker builder cache older than 24h..."
                docker builder prune -f --filter until=24h
            fi
            ;;
        *)
            echo "Skipping Docker prune."
            ;;
    esac
}

require_command docker

mkdir -p "$CLEANUP_ARCHIVE_DIR"
echo "Cleanup archive directory: $CLEANUP_ARCHIVE_DIR"

archive_file "$REPO_ROOT/.env"
archive_file "$REPO_ROOT/builder/.env"
archive_file "$REPO_ROOT/builder/production-release/.env"

for container in $CLEANUP_CONTAINERS; do
    remove_container "$container"
done

remove_postgres_volumes
disable_nginx
prune_docker

echo
echo "Remaining containers:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo
echo "Docker disk usage:"
docker system df

echo
echo "EC2 cleanup complete."
