@{
    # Copy this file to rds-export.config.psd1. That filename is ignored by Git.
    # Do not put the database password in this file; the export script prompts for it.
    RdsHost = "novaflow-postgres.xxxxxx.us-east-1.rds.amazonaws.com"
    RdsPort = 5432
    RdsUsername = "novaflow_admin"

    Databases = @(
        "user_service_db"
        "idea_service_db"
        "ai_service_db"
    )

    # Leave SsmInstanceId empty when RDS is directly reachable from the laptop.
    # Set it to the production EC2 managed-instance ID to tunnel through AWS SSM.
    SsmInstanceId = ""
    AwsRegion = "us-east-1"
    AwsProfile = ""
    LocalTunnelPort = 15432
}
