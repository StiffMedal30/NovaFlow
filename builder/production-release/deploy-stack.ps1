[CmdletBinding()]
param(
    [string]$ComposeFile = (Join-Path $PSScriptRoot "docker-compose.production.yml"),
    [string]$EnvFile,
    [string]$ImagePrefix = $env:IMAGE_PREFIX,
    [string]$ImageTag = $env:IMAGE_TAG,
    [int]$TimeoutSeconds = 180,
    [switch]$PullImages,
    [switch]$SkipPull,
    [ValidateSet("FastForwardOnly", "Rebase", "Reset", "None")]
    [string]$GitPullMode = "FastForwardOnly",
    [switch]$SkipGitPull
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ComposeFilePath = (Resolve-Path $ComposeFile).Path

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $ProductionEnvFile = Join-Path $PSScriptRoot ".env"
    $BuilderEnvFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
    $RootEnvFile = Join-Path $RepoRoot ".env"

    if (Test-Path $ProductionEnvFile) {
        $EnvFile = $ProductionEnvFile
    }
    elseif (Test-Path $BuilderEnvFile) {
        $EnvFile = $BuilderEnvFile
    }
    elseif (Test-Path $RootEnvFile) {
        $EnvFile = $RootEnvFile
    }
}

if (-not [string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = (Resolve-Path $EnvFile).Path
    Write-Host "Using env file: $EnvFile"
}
else {
    Write-Host "No .env file found. Docker Compose will use the current process environment."
}

function Read-DotenvValues {
    param([string]$Path)

    $Values = @{}
    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path $Path)) {
        return $Values
    }

    foreach ($Line in Get-Content -Path $Path) {
        $Trimmed = $Line.Trim()
        if ([string]::IsNullOrWhiteSpace($Trimmed) -or $Trimmed.StartsWith("#") -or -not $Trimmed.Contains("=")) {
            continue
        }

        $Separator = $Trimmed.IndexOf("=")
        $Key = $Trimmed.Substring(0, $Separator).Trim()
        $Value = $Trimmed.Substring($Separator + 1).Trim()

        if (($Value.StartsWith('"') -and $Value.EndsWith('"')) -or
            ($Value.StartsWith("'") -and $Value.EndsWith("'"))) {
            $Value = $Value.Substring(1, $Value.Length - 2)
        }

        if (-not $Values.ContainsKey($Key)) {
            $Values[$Key] = $Value
        }
    }

    return $Values
}

$script:DotenvValues = Read-DotenvValues -Path $EnvFile

if ([string]::IsNullOrWhiteSpace($ImagePrefix) -and $script:DotenvValues.ContainsKey("IMAGE_PREFIX")) {
    $ImagePrefix = $script:DotenvValues["IMAGE_PREFIX"]
}

if ([string]::IsNullOrWhiteSpace($ImageTag) -and $script:DotenvValues.ContainsKey("IMAGE_TAG")) {
    $ImageTag = $script:DotenvValues["IMAGE_TAG"]
}

if ([string]::IsNullOrWhiteSpace($ImageTag)) {
    $ImageTag = "latest"
}

if (-not [string]::IsNullOrWhiteSpace($ImagePrefix) -and -not $ImagePrefix.EndsWith("/")) {
    $ImagePrefix = "$ImagePrefix/"
}

$env:IMAGE_PREFIX = $ImagePrefix
$env:IMAGE_TAG = $ImageTag

function Get-EnvOrDefault {
    param(
        [string]$Name,
        [string]$Default
    )

    $Value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        if ($script:DotenvValues.ContainsKey($Name) -and -not [string]::IsNullOrWhiteSpace($script:DotenvValues[$Name])) {
            return $script:DotenvValues[$Name]
        }

        return $Default
    }

    return $Value
}

$PrerequisiteServices = @(
    @{ Name = "postgres"; Url = $null },
    @{ Name = "rabbitmq"; Url = $null },
    @{ Name = "eureka"; Url = "http://localhost:$(Get-EnvOrDefault 'EUREKA_HOST_PORT' '8761')" },
    @{ Name = "config-server"; Url = "http://localhost:$(Get-EnvOrDefault 'CONFIG_SERVER_HOST_PORT' '7090')/actuator/health" }
)

$RolloutServices = @(
    @{ Name = "user-service"; Url = "http://localhost:$(Get-EnvOrDefault 'USER_SERVICE_HOST_PORT' '7010')/actuator/health" },
    @{ Name = "idea-service"; Url = "http://localhost:$(Get-EnvOrDefault 'IDEA_SERVICE_HOST_PORT' '7020')/actuator/health" },
    @{ Name = "ai-service"; Url = "http://localhost:$(Get-EnvOrDefault 'AI_SERVICE_HOST_PORT' '7030')/actuator/health" },
    @{ Name = "chat-service"; Url = "http://localhost:$(Get-EnvOrDefault 'CHAT_SERVICE_HOST_PORT' '8085')/actuator/health" },
    @{ Name = "email-service"; Url = "http://localhost:$(Get-EnvOrDefault 'EMAIL_SERVICE_HOST_PORT' '8050')/actuator/health" },
    @{ Name = "api-gateway"; Url = "http://localhost:$(Get-EnvOrDefault 'API_GATEWAY_HOST_PORT' '8081')/actuator/health" },
    @{ Name = "novafront"; Url = "http://localhost:$(Get-EnvOrDefault 'FRONTEND_HOST_PORT' '3000')" }
)

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

function Invoke-GitPull {
    if ($SkipGitPull -or $GitPullMode -eq "None") {
        Write-Host "Skipping git pull."
        return
    }

    Push-Location $RepoRoot
    try {
        switch ($GitPullMode) {
            "FastForwardOnly" {
                Write-Host ""
                Write-Host "> git pull --ff-only"
                & git pull --ff-only
            }
            "Rebase" {
                Write-Host ""
                Write-Host "> git pull --rebase --autostash"
                & git pull --rebase --autostash
            }
            "Reset" {
                Write-Host "Resetting this checkout to its upstream branch. Local tracked changes will be discarded."
                Write-Host ""
                Write-Host "> git fetch --prune"
                & git fetch --prune
                if ($LASTEXITCODE -ne 0) {
                    throw "git fetch failed with exit code $LASTEXITCODE."
                }

                Write-Host ""
                Write-Host "> git reset --hard @{u}"
                & git reset --hard "@{u}"
            }
        }

        if ($LASTEXITCODE -ne 0) {
            throw "git update failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Get-DockerComposeArguments {
    param([string[]]$Arguments)

    $ComposeArguments = @()
    $ComposeArguments += $script:ComposePrefix

    if (-not [string]::IsNullOrWhiteSpace($EnvFile)) {
        $ComposeArguments += @("--env-file", $EnvFile)
    }

    $ComposeArguments += @("-f", $ComposeFilePath)
    $ComposeArguments += $Arguments
    return $ComposeArguments
}

function Invoke-DockerCompose {
    param([string[]]$Arguments)

    $ComposeArguments = Get-DockerComposeArguments -Arguments $Arguments
    Write-Host ""
    Write-Host "> $($script:ComposeExecutable) $($ComposeArguments -join ' ')"
    & $script:ComposeExecutable @ComposeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed with exit code $LASTEXITCODE."
    }
}

function Invoke-DockerComposeOutput {
    param([string[]]$Arguments)

    $ComposeArguments = Get-DockerComposeArguments -Arguments $Arguments
    $Output = & $script:ComposeExecutable @ComposeArguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed: $Output"
    }

    return $Output
}

function Get-ContainerId {
    param([string]$Service)

    $ContainerId = Invoke-DockerComposeOutput -Arguments @("ps", "-q", $Service) |
        Select-Object -First 1

    if ($null -eq $ContainerId) {
        return ""
    }

    return "$ContainerId".Trim()
}

function Get-DockerInspectValue {
    param(
        [string]$ContainerId,
        [string]$Format
    )

    $Output = & docker inspect --format $Format $ContainerId 2>$null
    if ($LASTEXITCODE -ne 0 -or $null -eq $Output) {
        return ""
    }

    return "$Output".Trim()
}

function Test-HttpReady {
    param([string]$Url)

    try {
        $Request = [System.Net.HttpWebRequest]::Create($Url)
        $Request.Method = "GET"
        $Request.AllowAutoRedirect = $false
        $Request.Timeout = 5000

        $Response = $Request.GetResponse()
        try {
            return ([int]$Response.StatusCode -lt 500)
        }
        finally {
            $Response.Dispose()
        }
    }
    catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $StatusCode = [int]$_.Exception.Response.StatusCode
            $_.Exception.Response.Dispose()
            return ($StatusCode -lt 500)
        }
    }
    catch {
    }

    return $false
}

function Wait-ServiceReady {
    param(
        [string]$Service,
        [string]$Url
    )

    Write-Host "Waiting for $Service..."
    $Deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $Deadline) {
        $ContainerId = Get-ContainerId -Service $Service

        if (-not [string]::IsNullOrWhiteSpace($ContainerId)) {
            $Status = Get-DockerInspectValue -ContainerId $ContainerId -Format "{{.State.Status}}"
            $Health = Get-DockerInspectValue -ContainerId $ContainerId -Format "{{if .State.Health}}{{.State.Health.Status}}{{end}}"

            if ($Status -eq "running") {
                if (-not [string]::IsNullOrWhiteSpace($Health) -and $Health -ne "healthy") {
                    Start-Sleep -Seconds 5
                    continue
                }

                if ([string]::IsNullOrWhiteSpace($Url) -or (Test-HttpReady -Url $Url)) {
                    Write-Host "$Service is ready."
                    return
                }
            }
        }

        Start-Sleep -Seconds 5
    }

    throw "$Service did not become ready within $TimeoutSeconds seconds."
}

Write-Host "Updating repository..."
Invoke-GitPull

Set-DockerComposeCommand

$ShouldPullImages = -not $SkipPull -and ($PullImages -or -not [string]::IsNullOrWhiteSpace($ImagePrefix))

Write-Host "Ensuring production dependencies are running..."
foreach ($Service in $PrerequisiteServices) {
    Invoke-DockerCompose -Arguments @("up", "-d", $Service.Name)
    Wait-ServiceReady -Service $Service.Name -Url $Service.Url
}

Write-Host ""
Write-Host "Rolling application services one at a time..."
foreach ($Service in $RolloutServices) {
    if ($ShouldPullImages) {
        Invoke-DockerCompose -Arguments @("pull", $Service.Name)
    }

    Invoke-DockerCompose -Arguments @("stop", $Service.Name)
    Invoke-DockerCompose -Arguments @("rm", "-f", $Service.Name)
    Invoke-DockerCompose -Arguments @("up", "-d", "--no-deps", "--force-recreate", $Service.Name)
    Wait-ServiceReady -Service $Service.Name -Url $Service.Url
}

Write-Host ""
Invoke-DockerCompose -Arguments @("ps")
Write-Host ""
Write-Host "Production rollout complete."
