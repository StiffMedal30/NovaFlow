# AWS Resource Inventory

This is the known NovaFlow AWS inventory from the learning deployment. Verify names in the AWS console before deleting or changing resources, because AWS resources can be renamed or recreated independently from this repo.

## Public Entry

| Resource | Known name/value | Purpose |
| --- | --- | --- |
| Domain | `novaflow.dotze.co.za` | Public app URL |
| DNS record | CNAME to ALB DNS name | Routes the domain to AWS |
| Load balancer | `novaflow-alb` | Public HTTP/HTTPS entry point |
| Certificate | ACM certificate for `novaflow.dotze.co.za` | TLS for HTTPS |
| HTTP listener | `80` | Redirects HTTP to HTTPS |
| HTTPS listener | `443` | Main production listener |

## ALB Target Groups

| Target group | Target | Purpose |
| --- | --- | --- |
| `novaflow-frontend-tg` | Frontend task/container | Serves React app |
| `novaflow-api-gateway-tg` | API gateway task/container | Serves `/api/*`, OAuth, and login callback paths |

The ALB listener rules should route:

| Path | Target group |
| --- | --- |
| `/api/*` | `novaflow-api-gateway-tg` |
| `/oauth2/*` | `novaflow-api-gateway-tg` |
| `/login/oauth2/*` | `novaflow-api-gateway-tg` |
| Default `/` | `novaflow-frontend-tg` |

## Compute And Orchestration

| Resource | Known name/value | Purpose |
| --- | --- | --- |
| EC2 instance | `novaflow` | ECS container host |
| ECS cluster | `novaflow-production` | Groups ECS tasks and services |
| Frontend ECS service | `novaflow-novafront` | Keeps frontend task running |
| Backend ECS service | `novaflow-backend` | Keeps backend task running |
| Frontend task definition | `novaflow-novafront-ec2` | Frontend container spec |
| Backend task definition | `novaflow-backend-ec2` | Backend container group spec |

## Images

ECR namespace:

```text
novaflow
```

Expected ECR repositories:

| Repository |
| --- |
| `novaflow/config-server` |
| `novaflow/user-service` |
| `novaflow/idea-service` |
| `novaflow/ai-service` |
| `novaflow/chat-service` |
| `novaflow/email-service` |
| `novaflow/api-gateway` |
| `novaflow/novafront` |

## Data

| Resource | Known name/value | Purpose |
| --- | --- | --- |
| RDS instance | `novaflow-postgres` | PostgreSQL host |
| Database | `user_service_db` | Users, auth, activation |
| Database | `idea_service_db` | Ideas and idea steps |
| Database | `ai_service_db` | AI service data and migration tracking |
| RabbitMQ | ECS/container on EC2 | Message broker for email notifications |

## Configuration And Secrets

| Resource | Known name/value | Purpose |
| --- | --- | --- |
| SSM Parameter Store path | `/novaflow/production/env` | App runtime environment |
| CloudWatch log group | `/novaflow/production` | App and container logs |

Secrets should be `SecureString` parameters. Non-sensitive runtime values can be `String` parameters.

## IAM Roles

| Role | Purpose |
| --- | --- |
| `NovaFlowEC2SSMRole` | EC2 instance role for SSM, ECR reads, Parameter Store reads, and CloudWatch logs |
| `ecsTaskExecutionRole` | ECS task execution role for pulling ECR images, reading task secrets, and writing logs |
| `NovaFlowGithubActionsSsmDeploy` | GitHub Actions OIDC role for CI/CD deployment |

## Security Groups

| Security group name | Purpose |
| --- | --- |
| `novaflow-alb-public` | Allows public HTTP/HTTPS traffic into the ALB |
| `novaflow-ec2-from-alb` | Allows ALB traffic into EC2/ECS target ports |
| RDS access group | Allows PostgreSQL traffic from the EC2/ECS security group to RDS |

Keep the personal SSH rule only as break-glass access. Normal deployments should use SSM.

## Teardown Reminder

When shutting this down to stop costs, delete resources in dependency order:

1. ECS services and tasks.
2. ALB listeners, target groups, and ALB.
3. ECR repositories if images are no longer needed.
4. RDS snapshot or export, then RDS instance.
5. EC2 instance and related EBS volumes.
6. Elastic IP if one still exists.
7. CloudWatch log groups if logs are no longer needed.
8. Parameter Store values if secrets should be destroyed.
9. IAM roles and policies created only for NovaFlow.
10. DNS records and ACM certificate validation records if the domain is no longer used.

Use [AWS recap and teardown](aws-recap-and-teardown.md) for the detailed teardown checklist.
