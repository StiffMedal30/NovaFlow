[CmdletBinding()]
param(
    [string]$ImagePrefix = $env:IMAGE_PREFIX,
    [string]$ImageTag = $env:IMAGE_TAG,
    [switch]$Push,
    [switch]$SkipGradleBuild,
    [ValidateSet("FastForwardOnly", "Rebase", "Reset", "None")]
    [string]$GitPullMode = "FastForwardOnly",
    [switch]$SkipGitPull
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$GradleWrapper = Join-Path $RepoRoot "gradlew.bat"

if (-not (Test-Path $GradleWrapper)) {
    $GradleWrapper = Join-Path $RepoRoot "gradlew"
}

if (-not (Test-Path $GradleWrapper)) {
    throw "Could not find a Gradle wrapper in $RepoRoot."
}

if ([string]::IsNullOrWhiteSpace($ImageTag)) {
    $ImageTag = "latest"
}

if (-not [string]::IsNullOrWhiteSpace($ImagePrefix) -and -not $ImagePrefix.EndsWith("/")) {
    $ImagePrefix = "$ImagePrefix/"
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

Write-Host "Updating repository..."
Invoke-GitPull

if (-not $SkipGradleBuild) {
    Write-Host "Running Gradle buildAll..."
    Invoke-CheckedCommand -FilePath $GradleWrapper -Arguments @("buildAll")
}

foreach ($Service in $ImageServices) {
    Invoke-CheckedCommand -FilePath $GradleWrapper -Arguments @("serviceImage", "-Pservice=$Service")

    $SourceImage = "${Service}:latest"
    $TargetImage = "${ImagePrefix}${Service}:${ImageTag}"

    if ($TargetImage -ne $SourceImage) {
        Invoke-CheckedCommand -FilePath "docker" -Arguments @("tag", $SourceImage, $TargetImage)
    }

    if ($Push) {
        Invoke-CheckedCommand -FilePath "docker" -Arguments @("push", $TargetImage)
    }
}

Write-Host ""
Write-Host "Built application images with tag '$ImageTag'."
if ($Push) {
    Write-Host "Pushed application images."
}
else {
    Write-Host "Images were not pushed. Pass -Push when the pipeline should publish them."
}
