Param(
    [string]$Target
)

# Stop on error
$ErrorActionPreference = "Stop"

function ErrorExit($message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

function UpdateBranch() {
    Write-Host "Updating branch in $(Get-Location)..."
    # git checkout develop | Out-Null
    # git pull origin develop | Out-Null
}

function Build-Service($service) {
    Write-Host "Changing directory to $service..."
    Set-Location (Join-Path $PSScriptRoot "..\$service") -ErrorAction Stop

    UpdateBranch

    Write-Host "Running Gradle clean build for $service..."
    try {
        gradle clean build
    } catch {
        ErrorExit "Gradle build failed for $service"
    }

    Write-Host "Stopping old Docker container (if exists)..."
    docker container stop $service 2>$null

    Write-Host "Removing old Docker container (if exists)..."
    docker container rm $service 2>$null

    Write-Host "Removing old Docker image (if exists)..."
    docker image rm "$service:latest" -f 2>$null

    Write-Host "Building new Docker image for $service..."
    try {
        docker build -t $service .
    } catch {
        ErrorExit "Docker build failed for $service"
    }

    Pop-Location
}

function Build-Novafront() {
    Write-Host "Changing directory to novafront..."
    Set-Location (Join-Path $PSScriptRoot "../novafront") -ErrorAction Stop

    UpdateBranch

    Write-Host "Running npm build for novafront..."
    try {
        npm install
        npm run build
    } catch {
        ErrorExit "Frontend build failed for novafront"
    }

    Write-Host "Building new Docker image for novafront..."
    try {
        docker build -t novafront .
    } catch {
        ErrorExit "Docker build failed for novafront"
    }

    Pop-Location
}

function Start-Compose([string[]]$services) {
    Write-Host "Changing directory to builder..."
    Set-Location (Join-Path $PSScriptRoot "../builder") -ErrorAction Stop

    # UpdateBranch  # optional

    Write-Host "Starting services with Docker Compose..."
    try {
        docker-compose up -d $services
    } catch {
        ErrorExit "docker-compose failed"
    }

    Pop-Location
}

# MAIN
$services = @("config-server", "ai-service", "api-gateway", "idea-service", "user-service", "novafront")

if ($Target) {
    if ($services -contains $Target) {
        if ($Target -eq "novafront") {
            Build-Novafront
        } else {
            Build-Service $Target
        }
        if ($Target -ne "novafront") {
            Start-Compose @($Target)
        }
    } else {
        ErrorExit "Unknown service: $Target"
    }
} else {
    foreach ($service in $services) {
        if ($service -eq "novafront") {
            Build-Novafront
        } else {
            Build-Service $service
        }
    }

    # Start config-server first, then dependencies
    Start-Compose @("config-server", "ai-service", "user-service", "idea-service", "api-gateway")
}

Write-Host "Build and deployment completed successfully!" -ForegroundColor Green
