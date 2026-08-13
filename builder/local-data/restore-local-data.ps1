[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param(
    [Parameter(Mandatory = $true)]
    [string]$DumpDirectory,
    [string]$ComposeFile = (Join-Path $PSScriptRoot "..\docker-compose.local.yml"),
    [string]$EnvFile,
    [string]$LocalUsername = "sa",
    [string[]]$Database = @("user_service_db", "idea_service_db", "ai_service_db"),
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$DumpDirectory = (Resolve-Path -LiteralPath $DumpDirectory).Path
$ComposeFile = (Resolve-Path -LiteralPath $ComposeFile).Path

$ComposePrefix = @("compose")
if (-not [string]::IsNullOrWhiteSpace($EnvFile)) {
    $ComposePrefix += @("--env-file", (Resolve-Path -LiteralPath $EnvFile).Path)
}
$ComposePrefix += @("-f", $ComposeFile)

function Invoke-Compose([string[]]$Arguments) {
    & docker @ComposePrefix @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose command failed with exit code $LASTEXITCODE." }
}

& docker version --format '{{.Server.Version}}' *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker is required and its engine must be running." }

$Missing = @($Database | Where-Object { -not (Test-Path -LiteralPath (Join-Path $DumpDirectory "$_.dump")) })
if ($Missing.Count -gt 0) { throw "Missing dump files: $($Missing -join ', ')" }

if (-not $Force -and -not $PSCmdlet.ShouldContinue(
    "This replaces the public schema in the LOCAL databases: $($Database -join ', ').",
    "Restore NovaFlow development data?")) {
    Write-Host "Restore cancelled."
    exit 0
}

Invoke-Compose @("up", "-d", "postgres")
$ContainerId = (& docker @ComposePrefix "ps" "-q" "postgres").Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($ContainerId)) { throw "Could not find the local PostgreSQL container." }

foreach ($DatabaseName in $Database) {
    if ($DatabaseName -notmatch '^[A-Za-z0-9_]+$') { throw "Unsafe database name: $DatabaseName" }
    $DumpFile = Join-Path $DumpDirectory "$DatabaseName.dump"
    Write-Host "Restoring $DatabaseName..."

    & docker exec $ContainerId psql --username=$LocalUsername --dbname=postgres --set=ON_ERROR_STOP=1 `
        --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DatabaseName' AND pid <> pg_backend_pid();"
    if ($LASTEXITCODE -ne 0) { throw "Could not disconnect sessions from '$DatabaseName'." }

    $ContainerDump = "/tmp/novaflow-$DatabaseName.dump"
    try {
        & docker cp $DumpFile "${ContainerId}:$ContainerDump"
        if ($LASTEXITCODE -ne 0) { throw "Could not copy the dump for '$DatabaseName' into the PostgreSQL container." }

        & docker exec $ContainerId pg_restore --username=$LocalUsername --dbname=$DatabaseName `
            --clean --if-exists --no-owner --no-acl --exit-on-error $ContainerDump
        if ($LASTEXITCODE -ne 0) { throw "Restore failed for database '$DatabaseName'." }
    }
    finally {
        & docker exec $ContainerId rm -f $ContainerDump 2>$null
    }
}

Write-Host "Local NovaFlow databases restored successfully. Restart locally running application services before testing."
