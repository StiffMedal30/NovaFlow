# NovaFlow Documentation

This folder is the human map for NovaFlow. The root README is still the quick entry point, but these documents explain how the system fits together, how to run it, and how the AWS version works.

## Start here

| Topic | Document |
| --- | --- |
| What NovaFlow is and how the services connect | [Architecture](architecture.md) |
| Running the app on your machine | [Local development](local-development.md) |
| Environment variables, secrets, and Parameter Store | [Configuration](configuration.md) |
| GitHub Actions, ECR, SSM, ECS, and production releases | [Deployment](deployment.md) |
| Day-to-day checks, logs, admin users, and cleanup | [Operations](operations.md) |
| Test commands and CI expectations | [Testing](testing.md) |
| Actual AWS names and inventory | [AWS resource inventory](aws-resource-inventory.md) |
| AWS learning recap and teardown checklist | [AWS recap and teardown](aws-recap-and-teardown.md) |
| ECS-specific migration notes and task commands | [ECS notes](../builder/ecs/README.md) |
| Handoff-friendly Word version | [NovaFlow documentation DOCX](novaflow-documentation.docx) |

The Word version can be regenerated with:

```powershell
python docs\tools\build_novaflow_docx.py
```

## Current AWS Shape

NovaFlow was migrated from "everything on one EC2 box with Docker Compose" into a more AWS-native learning setup:

| Area | Current service |
| --- | --- |
| Public HTTPS entry | ALB with ACM certificate |
| Compute | EC2 running ECS tasks |
| Container orchestration | ECS on EC2 |
| Container images | ECR |
| Database | RDS PostgreSQL |
| Secrets and runtime config | SSM Parameter Store |
| Deploy access | SSM Run Command |
| Logs | CloudWatch Logs |
| Break-glass access | Personal SSH rule only |

Fargate has been discussed but is not part of the implemented setup yet.

## New Developer Path

1. Read [Architecture](architecture.md) to understand the services.
2. Follow [Local development](local-development.md) to run NovaFlow locally.
3. Use [Configuration](configuration.md) when adding or changing environment variables.
4. Run the checks in [Testing](testing.md) before opening a PR.

## Operator Path

1. Use [Operations](operations.md) for health checks, logs, seed users, and cleanup.
2. Use [Deployment](deployment.md) for release flow and AWS permissions.
3. Use [AWS recap and teardown](aws-recap-and-teardown.md) before deleting paid AWS resources.
