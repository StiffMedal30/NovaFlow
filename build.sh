#!/bin/bash

set -e  # Exit on any error
set -o pipefail  # Catch errors in pipelines

# Helper function for error messages
error_exit() {
    echo "❌ ERROR: $1"
    exit 1
}

# Function to update branch
update_branch() {
    echo "🔄 Updating branch in $(pwd)..."
    git checkout develop || error_exit "Failed to checkout develop branch"
    git pull origin develop || error_exit "Failed to pull latest develop branch"
}

# Function to build a service
build_service() {
    local service=$1
    echo "📂 Changing directory to $service..."
    cd "../$service" || error_exit "Could not find ../$service directory"

    update_branch

    echo "🛠 Running Gradle clean build for $service..."
    if ! gradle clean build; then
        error_exit "Gradle build failed for $service"
    fi

    echo "🛑 Stopping old Docker container (if exists)..."
    docker container stop "$service" || echo "ℹ️ No running container to stop"

    echo "🗑 Removing old Docker container (if exists)..."
    docker container rm "$service" || echo "ℹ️ No container to remove"

    echo "🗑 Removing old Docker image (if exists)..."
    docker image rm "$service" || echo "ℹ️ No image to remove"

    echo "📦 Building new Docker image for $service..."
    if ! docker build -t "$service" .; then
        error_exit "Docker build failed for $service"
    fi

    cd - >/dev/null || error_exit "Failed to return to previous directory"
}

# Function to handle novafront (custom build steps)
build_novafront() {
    echo "📂 Changing directory to novafront..."
    cd ../novafront || error_exit "Could not find ../novafront directory"

    update_branch

    echo "🛠 Running npm/yarn build for novafront..."
    if ! npm install && npm run build; then
        error_exit "Frontend build failed for novafront"
    fi

    echo "📦 Building new Docker image for novafront..."
    if ! docker build -t "novafront" .; then
        error_exit "Docker build failed for novafront"
    fi

    cd - >/dev/null || error_exit "Failed to return to previous directory"
}

# Function to start docker-compose
start_compose() {
    echo "📂 Changing directory to builder..."
    cd ../builder || error_exit "Could not find ../builder directory"

    update_branch

    echo "🚀 Starting services with Docker Compose..."
    if ! docker-compose --profile prod up -d "$@"; then
        error_exit "docker-compose failed"
    fi

    cd - >/dev/null || error_exit "Failed to return to previous directory"
}

# ///////////////////////////////////////////////////////////////////////////
# MAIN SCRIPT
# ///////////////////////////////////////////////////////////////////////////

SERVICES=("config-server" "ai-service" "api-gateway" "idea-service" "user-service" "novafront")

TARGET=$1

if [ -n "$TARGET" ]; then
    if [[ " ${SERVICES[*]} " =~ " ${TARGET} " ]]; then
        if [ "$TARGET" == "novafront" ]; then
            build_novafront
        else
            build_service "$TARGET"
        fi
        start_compose "$TARGET"
    else
        error_exit "Unknown service: $TARGET"
    fi
else
    # Build all services if no target is given
    for service in "${SERVICES[@]}"; do
        if [ "$service" == "novafront" ]; then
            build_novafront
        else
            build_service "$service"
        fi
    done
    start_compose ai-service user-service idea-service api-gateway config-server
fi

echo "✅ Build and deployment completed successfully!"
