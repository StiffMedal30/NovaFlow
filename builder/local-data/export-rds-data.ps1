[CmdletBinding()]
param(
    [string]$ConfigFile = (Join-Path $PSScriptRoot "rds-export.config.psd1"),
    [string]$OutputDirectory,
    [string[]]$Database,
    [switch]$NoSsmTunnel
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found."
    }
}

function ConvertTo-PlainText([Security.SecureString]$Value) {
    $Pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Pointer) }
}

if (-not (Test-Path -LiteralPath $ConfigFile)) {
    throw "Configuration file not found: $ConfigFile. Copy rds-export.config.example.psd1 to rds-export.config.psd1 and fill in the non-secret settings."
}

$Config = Import-PowerShellDataFile -LiteralPath $ConfigFile
foreach ($Name in @("RdsHost", "RdsUsername")) {
    if ([string]::IsNullOrWhiteSpace([string]$Config[$Name])) {
        throw "The configuration value '$Name' is required."
    }
}

Require-Command "docker"
& docker version --format '{{.Server.Version}}' *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker is required and its engine must be running." }

$Databases = if ($Database.Count -gt 0) { $Database } else { @($Config.Databases) }
if ($Databases.Count -eq 0) { throw "At least one database must be configured." }

$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path "backups\rds-local-dev\$Timestamp"
}
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$Password = ConvertTo-PlainText (Read-Host "RDS password for $($Config.RdsUsername)" -AsSecureString)
if ([string]::IsNullOrEmpty($Password)) { throw "The RDS password cannot be empty." }

$TunnelProcess = $null
$ConnectHost = [string]$Config.RdsHost
$ConnectPort = if ($Config.RdsPort) { [int]$Config.RdsPort } else { 5432 }
$UseTunnel = -not $NoSsmTunnel -and -not [string]::IsNullOrWhiteSpace([string]$Config.SsmInstanceId)

try {
    if ($UseTunnel) {
        Require-Command "aws"
        $ConnectHost = "host.docker.internal"
        $ConnectPort = if ($Config.LocalTunnelPort) { [int]$Config.LocalTunnelPort } else { 15432 }
        $Parameters = '{"host":["' + $Config.RdsHost + '"],"portNumber":["' + $(if ($Config.RdsPort) { $Config.RdsPort } else { 5432 }) + '"],"localPortNumber":["' + $ConnectPort + '"]}'
        $AwsArguments = @("ssm", "start-session", "--target", [string]$Config.SsmInstanceId,
            "--document-name", "AWS-StartPortForwardingSessionToRemoteHost", "--parameters", $Parameters,
            "--region", $(if ($Config.AwsRegion) { [string]$Config.AwsRegion } else { "us-east-1" }))
        if (-not [string]::IsNullOrWhiteSpace([string]$Config.AwsProfile)) {
            $AwsArguments += @("--profile", [string]$Config.AwsProfile)
        }
        Write-Host "Starting SSM tunnel on localhost:$ConnectPort..."
        $TunnelProcess = Start-Process -FilePath "aws" -ArgumentList $AwsArguments -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 3
        if ($TunnelProcess.HasExited) { throw "The SSM tunnel exited before it became ready. Check AWS credentials and the Session Manager plugin." }
    }

    foreach ($DatabaseName in $Databases) {
        if ($DatabaseName -notmatch '^[A-Za-z0-9_]+$') { throw "Unsafe database name: $DatabaseName" }
        $OutputFile = Join-Path $OutputDirectory "$DatabaseName.dump"
        Write-Host "Exporting $DatabaseName to $OutputFile..."
        & docker run --rm `
            -e "PGPASSWORD=$Password" `
            -v "${OutputDirectory}:/backups" `
            postgres:15 `
            pg_dump --host=$ConnectHost --port=$ConnectPort --username=$($Config.RdsUsername) `
                --dbname=$DatabaseName --format=custom --compress=6 --no-owner --no-acl `
                --file="/backups/$DatabaseName.dump"
        if ($LASTEXITCODE -ne 0) { throw "Export failed for database '$DatabaseName'." }
    }

    Write-Host "Export complete: $OutputDirectory"
}
finally {
    $Password = $null
    if ($TunnelProcess -and -not $TunnelProcess.HasExited) {
        Stop-Process -Id $TunnelProcess.Id -Force
        Write-Host "Stopped the SSM tunnel."
    }
}
