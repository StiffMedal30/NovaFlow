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
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $serviceDirectory = Join-Path $repoRoot $service

    UpdateBranch

    Write-Host "Running root Gradle build for $service..."
    try {
        Push-Location $repoRoot
        & (Join-Path $repoRoot "gradlew.bat") ":${service}:clean" ":${service}:build"
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle exited with code $LASTEXITCODE"
        }
    } catch {
        ErrorExit "Gradle build failed for $service"
    } finally {
        Pop-Location
    }

    Write-Host "Changing directory to $service..."
    Push-Location $serviceDirectory

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
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $frontendDirectory = Join-Path $repoRoot "novafront"

    UpdateBranch

    Write-Host "Running root Gradle build for novafront..."
    try {
        Push-Location $repoRoot
        & (Join-Path $repoRoot "gradlew.bat") ":novafront:clean" ":novafront:build"
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle exited with code $LASTEXITCODE"
        }
    } catch {
        ErrorExit "Frontend build failed for novafront"
    } finally {
        Pop-Location
    }

    Write-Host "Changing directory to novafront..."
    Push-Location $frontendDirectory

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
    Push-Location (Join-Path $PSScriptRoot "../builder") -ErrorAction Stop

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
