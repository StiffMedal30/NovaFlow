# RDS data for local development

These scripts export NovaFlow's PostgreSQL databases from RDS and restore them
into the local Docker PostgreSQL instance. Passwords are prompted for and are
not written to configuration or dump metadata.

## Configure

Copy `rds-export.config.example.psd1` to `rds-export.config.psd1` and set:

- the RDS endpoint;
- the RDS username;
- the AWS region;
- optionally, the production EC2 SSM instance ID when RDS is private.

The local configuration filename and all dumps are ignored by Git.

## Export

```powershell
.\builder\local-data\export-rds-data.ps1
```

When `SsmInstanceId` is configured, this requires the AWS CLI, Session Manager
plugin, valid AWS credentials, and permission to start an SSM session. For a
directly reachable RDS endpoint, leave `SsmInstanceId` empty.

## Restore locally

Start Docker, then pass the timestamped export directory:

```powershell
.\builder\local-data\restore-local-data.ps1 `
  -DumpDirectory .\backups\rds-local-dev\20260813-120000
```

The restore replaces the `public` schema in all three local databases and asks
for confirmation. Use only sanitized production data on development laptops.
