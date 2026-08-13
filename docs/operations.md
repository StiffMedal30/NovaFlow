# Operations

This document is for checking, fixing, and cleaning up NovaFlow without relying on SSH.

## Public Health Checks

Frontend:

```text
https://novaflow.dotze.co.za/login
```

Google OAuth status:

```text
https://novaflow.dotze.co.za/api/auth/google/status
```

Expected OAuth status response:

```json
{"enabled":true}
```

## AWS Console Checks

| Area | What to check |
| --- | --- |
| ECS cluster | Services, tasks, deployments, events |
| ECS service logs | Task logs for failed containers |
| ALB target groups | Healthy targets for frontend and API gateway |
| CloudWatch Logs | `/novaflow/production` log streams |
| RDS | Instance available, CPU, connections, storage |
| Parameter Store | Missing or incorrectly named parameters |
| SSM Run Command | Command status and stdout/stderr |

## Useful SSM Run Commands

Run these through Systems Manager -> Run Command -> `AWS-RunShellScript`.

Check container state:

```bash
whoami
hostname
cd /home/ubuntu/apps/novaflow
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Check disk usage:

```bash
sudo docker system df
df -h
```

Check ECS agent:

```bash
sudo systemctl status ecs --no-pager || true
sudo journalctl -u ecs -n 120 --no-pager
```

Check SSM agent:

```bash
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service --no-pager || true
sudo journalctl -u snap.amazon-ssm-agent.amazon-ssm-agent.service -n 120 --no-pager
```

## Admin Users

Create or update one admin user:

```bash
cd /home/ubuntu/apps/novaflow
SSM_ENV_PATH=/novaflow/production/env SSM_ENV_REGION=us-east-1 SEED_USERNAME='Admin' SEED_PASSWORD='Admin' sh builder/production-release/seed-admin-user.sh
```

Add more admins by changing `SEED_USERNAME` and `SEED_PASSWORD`.

Reset users for a clean test:

```bash
cd /home/ubuntu/apps/novaflow
SSM_ENV_PATH=/novaflow/production/env SSM_ENV_REGION=us-east-1 sh builder/production-release/reset-users.sh --yes
```

Use reset scripts carefully. They are intentionally destructive.

## Logs

CloudWatch log group:

```text
/novaflow/production
```

Useful filters:

| Search | Why |
| --- | --- |
| `ERROR` | Application failures |
| `Exception` | Java stack traces |
| `Authentication failed` | SMTP or login failures |
| `unhealthy` | Deployment and target health |
| `CannotPullImage` | ECR/task definition image problems |
| `Parameter Store` | Missing SSM parameters |

## Common Production Issues

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| Browser shows 502 | ALB target unhealthy or backend not listening | ALB target group, ECS events |
| Google sign-in says not configured | Missing/incorrect OAuth env values | Parameter Store, API gateway/user-service logs |
| ECS task stops immediately | Bad image tag, missing secret, container startup failure | ECS task details and logs |
| ECS cannot place task | Not enough memory/CPU or ECS agent offline | ECS service events, EC2 instance size |
| SSM deploy fails with access denied | EC2 role missing Parameter Store/ECR permission | IAM role `NovaFlowEC2SSMRole` |
| Email event reaches RabbitMQ but no email | SMTP auth/network/provider issue | email-service logs |
| RDS connection timeout | RDS security group inbound rule missing from EC2 SG | RDS SG, EC2 SG |

## Cleanup After AWS Migration

After RDS and ECS are working, the old local production containers and unused images can be cleaned:

```bash
cd /home/ubuntu/apps/novaflow
SSM_ENV_PATH=/novaflow/production/env SSM_ENV_REGION=us-east-1 sh builder/production-release/cleanup-ec2-after-aws-migration.sh --yes
```

Before removing AWS resources permanently, use the teardown checklist:

```text
docs/aws-recap-and-teardown.md
```
