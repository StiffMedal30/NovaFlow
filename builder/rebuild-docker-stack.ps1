[CmdletBinding()]
param(
    [string]$ComposeFile = (Join-Path $PSScriptRoot "docker-compose.yml"),
    [string]$EnvFile,
    [ValidateSet("FastForwardOnly", "Rebase", "Reset", "None")]
    [string]$GitPullMode = "FastForwardOnly",
    [switch]$SkipGitPull
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ComposeFilePath = (Resolve-Path $ComposeFile).Path
$GradleWrapper = Join-Path $RepoRoot "gradlew.bat"

if (-not (Test-Path $GradleWrapper)) {
    $GradleWrapper = Join-Path $RepoRoot "gradlew"
}

if (-not (Test-Path $GradleWrapper)) {
    throw "Could not find a Gradle wrapper in $RepoRoot."
}

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $RootEnvFile = Join-Path $RepoRoot ".env"
    $BuilderEnvFile = Join-Path $PSScriptRoot ".env"

    if (Test-Path $RootEnvFile) {
        $EnvFile = $RootEnvFile
    }
    elseif (Test-Path $BuilderEnvFile) {
        $EnvFile = $BuilderEnvFile
    }
}

if (-not [string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = (Resolve-Path $EnvFile).Path
    Write-Host "Using env file: $EnvFile"
}
else {
    Write-Host "No .env file found. Docker Compose will use the current process environment."
}

$ImageServices = @(
    "api-gateway",
    "user-service",
    "idea-service",
    "ai-service",
    "chat-service",
    "email-service",
    "novafront"
)

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [string]$WorkingDirectory = $RepoRoot
    )

    Push-Location $WorkingDirectory
    try {
        Write-Host ""
        Write-Host "> $FilePath $($Arguments -join ' ')"
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-GitPull {
    if ($SkipGitPull -or $GitPullMode -eq "None") {
        Write-Host "Skipping git pull."
        return
    }

    switch ($GitPullMode) {
        "FastForwardOnly" {
            Invoke-CheckedCommand -FilePath "git" -Arguments @("pull", "--ff-only")
        }
        "Rebase" {
            Invoke-CheckedCommand -FilePath "git" -Arguments @("pull", "--rebase", "--autostash")
        }
        "Reset" {
            Write-Host "Resetting this checkout to its upstream branch. Local tracked changes will be discarded."
            Invoke-CheckedCommand -FilePath "git" -Arguments @("fetch", "--prune")
            Invoke-CheckedCommand -FilePath "git" -Arguments @("reset", "--hard", "@{u}")
        }
    }
}

function Set-DockerComposeCommand {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        & docker compose version *> $null
        if ($LASTEXITCODE -eq 0) {
            $script:ComposeExecutable = "docker"
            $script:ComposePrefix = @("compose")
            return
        }
    }

    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $script:ComposeExecutable = "docker-compose"
        $script:ComposePrefix = @()
        return
    }

    throw "Could not find 'docker compose' or 'docker-compose'."
}

function Invoke-DockerCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $ComposeArguments = @()
    $ComposeArguments += $script:ComposePrefix

    if (-not [string]::IsNullOrWhiteSpace($EnvFile)) {
        $ComposeArguments += @("--env-file", $EnvFile)
    }

    $ComposeArguments += @("-f", $ComposeFilePath)
    $ComposeArguments += $Arguments

    Write-Host ""
    Write-Host "> $($script:ComposeExecutable) $($ComposeArguments -join ' ')"
    & $script:ComposeExecutable @ComposeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed with exit code $LASTEXITCODE."
    }
}

Write-Host "Updating repository..."
Invoke-GitPull

Write-Host "Running Gradle buildAll..."
Invoke-CheckedCommand -FilePath $GradleWrapper -Arguments @("buildAll")

Write-Host ""
Write-Host "Building application Docker images..."

foreach ($Service in $ImageServices) {
    Invoke-CheckedCommand -FilePath $GradleWrapper -Arguments @("serviceImage", "-Pservice=$Service")
}

Set-DockerComposeCommand

Write-Host ""
Write-Host "Stopping containers..."
Invoke-DockerCompose -Arguments @("stop")

Write-Host ""
Write-Host "Removing stopped containers..."
Invoke-DockerCompose -Arguments @("rm", "-f")

Write-Host ""
Write-Host "Creating containers from the new images..."
Invoke-DockerCompose -Arguments @("up", "-d", "--force-recreate", "--remove-orphans")

Write-Host ""
Write-Host "Docker stack recreated."
