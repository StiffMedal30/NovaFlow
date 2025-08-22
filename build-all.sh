#!/bin/bash

set -e  # Exit on any error
set -o pipefail  # Catch errors in pipelines

# Helper function for error messages
error_exit() {
    echo "❌ ERROR: $1"
    exit 1
}

echo "📂 Changing directory to config-server..."
cd ./config-server || error_exit "Could not find ./config-server directory"

echo "🔑 Setting environment variables..."
export EMAIL_HOST=mail.dotze.co.za
export EMAIL_PORT=465
export EMAIL_USERNAME=no-reply@dotze.co.za
export EMAIL_PASSWORD=OjaX?oW^c0@6
export EMAIL_PROTOCOL=smtp


# ///////////////////////////////////////////////////////////////////////////
# CONFIG-SERVER
# ///////////////////////////////////////////////////////////////////////////
# echo "🛠 Running Gradle clean build..."
# if ! gradle clean build; then
#     error_exit "Gradle build failed for config-server"
# fi

#echo "🛑 Stopping old Docker container (if exists)..."
#docker container stop config-server || echo "ℹ️ No running container to stop"
#
#echo "🗑 Removing old Docker container (if exists)..."
#docker container rm config-server || echo "ℹ️ No container to remove"
#
#echo "🗑 Removing old Docker image (if exists)..."
#docker image rm config-server || echo "ℹ️ No image to remove"
#
#echo "📦 Building new Docker image..."
#if ! docker build -t 'config-server' .; then
#    error_exit "Docker build failed for config-server"
#fi
#
#cd ../eureka || error_exit "Could not find ../eureka directory"
#
#echo "🚀 Starting services with Docker Compose..."
#if ! docker-compose up -d config-server ; then
#    error_exit "docker-compose failed"
#fi
# ///////////////////////////////////////////////////////////////////////////

# ///////////////////////////////////////////////////////////////////////////
# AI-SERVICE
# ///////////////////////////////////////////////////////////////////////////
echo "📂 Changing directory to ai-service..."
cd ../ai-service || error_exit "Could not find ../ai-service directory"
echo "🛠 Running Gradle clean build..."

if ! gradle clean build; then
    error_exit "Gradle build failed for ai-service"
fi

echo "🛑 Stopping old Docker container (if exists)..."
docker container stop ai-service || echo "ℹ️ No running container to stop"

echo "🗑 Removing old Docker container (if exists)..."
docker container rm ai-service || echo "ℹ️ No container to remove"

echo "🗑 Removing old Docker image (if exists)..."
docker image rm ai-service || echo "ℹ️ No image to remove"

echo "📦 Building new Docker image..."
if ! docker build -t 'ai-service' .; then
    error_exit "Docker build failed for ai-service"
fi

# ///////////////////////////////////////////////////////////////////////////

# ///////////////////////////////////////////////////////////////////////////
# API-GATEWAY
# ///////////////////////////////////////////////////////////////////////////
echo "📂 Changing directory to api-gateway..."
cd ../api-gateway || error_exit "Could not find ../api-gateway directory"
echo "🛠 Running Gradle clean build..."

if ! gradle clean build; then
    error_exit "Gradle build failed for api-gateway"
fi

echo "🛑 Stopping old Docker container (if exists)..."
docker container stop api-gateway || echo "ℹ️ No running container to stop"

echo "🗑 Removing old Docker container (if exists)..."
docker container rm api-gateway || echo "ℹ️ No container to remove"

echo "🗑 Removing old Docker image (if exists)..."
docker image rm api-gateway || echo "ℹ️ No image to remove"

echo "📦 Building new Docker image..."
if ! docker build -t 'api-gateway' .; then
    error_exit "Docker build failed for api-gateway"
fi
# ///////////////////////////////////////////////////////////////////////////



# ///////////////////////////////////////////////////////////////////////////
# IDEA-SERVICE
# ///////////////////////////////////////////////////////////////////////////
echo "📂 Changing directory to idea-service..."
cd ../idea-service || error_exit "Could not find ../idea-service directory"
echo "🛠 Running Gradle clean build..."
if ! gradle clean build; then
    error_exit "Gradle build failed for idea-service"
fi

echo "🛑 Stopping old Docker container (if exists)..."
docker container stop idea-service || echo "ℹ️ No running container to stop"

echo "🗑 Removing old Docker container (if exists)..."
docker container rm idea-service || echo "ℹ️ No container to remove"

echo "🗑 Removing old Docker image (if exists)..."
docker image rm idea-service || echo "ℹ️ No image to remove"

echo "📦 Building new Docker image..."
if ! docker build -t 'idea-service' .; then
    error_exit "Docker build failed for idea-service"
fi

# ///////////////////////////////////////////////////////////////////////////

# ///////////////////////////////////////////////////////////////////////////
# USER-SERVICE
# ///////////////////////////////////////////////////////////////////////////
echo "📂 Changing directory to user-service..."
cd ../user-service || error_exit "Could not find ../user-service directory"
echo "🛠 Running Gradle clean build..."
if ! gradle clean build; then
    error_exit "Gradle build failed for user-service"
fi

echo "🛑 Stopping old Docker container (if exists)..."
docker container stop user-service || echo "ℹ️ No running container to stop"

echo "🗑 Removing old Docker container (if exists)..."
docker container rm user-service || echo "ℹ️ No container to remove"

echo "🗑 Removing old Docker image (if exists)..."
docker image rm user-service || echo "ℹ️ No image to remove"

echo "📦 Building new Docker image..."
if ! docker build -t 'user-service' .; then
    error_exit "Docker build failed for user-service"
fi

# ///////////////////////////////////////////////////////////////////////////

# ///////////////////////////////////////////////////////////////////////////
# NOVAFRONT
# ///////////////////////////////////////////////////////////////////////////

echo "📂 Changing directory to novafront..."
cd ../novafront || error_exit "Could not find ../novafront directory"
echo "🛠 Do the build commands here, add properties as needed here too"


# ///////////////////////////////////////////////////////////////////////////

# ///////////////////////////////////////////////////////////////////////////
# EUREKA
# ///////////////////////////////////////////////////////////////////////////
echo "📂 Changing directory to eureka..."
cd ../eureka || error_exit "Could not find ../eureka directory"

echo "🚀 Starting services with Docker Compose..."
if ! docker-compose up -d ai-service user-service idea-service api-gateway; then
    error_exit "docker-compose failed"
fi

echo "✅ Build and deployment for config-server completed successfully!"
