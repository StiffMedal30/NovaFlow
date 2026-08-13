# NovaFlow ECS Pilot

This folder contains the first ECS migration step for NovaFlow.

The intended first move is deliberately small: run only `novafront` with ECS on
the existing EC2 instance, while the backend services continue to run through the
current Docker Compose production stack. This proves ECS, ECR pulls, ALB target
registration, health checks, CloudWatch logs, and rollback behavior without
moving Eureka, RabbitMQ, or the config server yet.

## Why Start With Only Novafront

`novafront` is the safest first ECS service because:

- it is a single container;
- it already serves HTTP on container port `80`;
- the ALB already routes normal browser traffic to the frontend target group;
- it does not need RabbitMQ, Eureka, RDS, or config-server service discovery;
- if it fails, the backend Compose stack is still untouched.

The normal Docker image includes an nginx proxy for `/api`, `/oauth2`, and
`/login/oauth2` that points at the Compose service name `api-gateway`. That name
only exists inside the Docker Compose network. The ECS task definition therefore
overrides the nginx config at startup so the container serves the React app only.
The ALB listener rules still send API and OAuth paths to the existing
`api-gateway` target group before those requests ever reach the frontend task.

The backend services are a later step because the current Compose stack uses
Docker bridge DNS names such as `rabbitmq`, `eureka`, and `config-server`. The
config server also mounts `common-config` from the EC2 filesystem. Those are easy
inside Compose, but they need a cleaner ECS design before moving the full stack.

## Target Shape

```text
Browser
  |
  v
ALB public listener :80/:443
  |
  +-- /api/*, /oauth2/*, /login/oauth2/* -> existing api-gateway on EC2:8081
  |
  +-- everything else -> ECS service novafront, container port 80

EC2 instance
  |
  +-- ECS agent runs novafront from ECR
  |
  +-- Docker Compose still runs backend services
```

This is ECS on EC2, not Fargate. EC2 still provides the CPU and memory. ECS
becomes the service manager for the frontend container.

## One-Time AWS Setup

### 1. Create The ECS Cluster

Create an ECS cluster named:

```text
novaflow-production
```

Do not create a new Auto Scaling group if the goal is to reuse the existing
NovaFlow EC2 instance. The ECS console can attach an Auto Scaling group, but it
cannot pick a random existing standalone EC2 instance in that field.

For the existing-EC2 pilot, create the cluster without EC2 capacity and register
the current instance manually with the ECS agent:

```sh
aws ecs create-cluster \
  --region us-east-1 \
  --cluster-name novaflow-production \
  --settings name=containerInsights,value=enabled
```

If you prefer to stay in the console and the wizard forces you to choose
something, choose **Fargate only**. That creates the cluster without launching a
new EC2 instance. It does not force the NovaFlow frontend to run on Fargate. The
frontend service template in this folder uses `launchType: EC2`, so it will run
on a registered EC2 instance after the existing NovaFlow host joins the cluster.

A second ECS-only EC2 instance is safer, but costs more. The current instance is
cheaper and good enough while learning.

### 2. Allow The EC2 Instance To Join ECS

Attach this AWS-managed policy to the EC2 instance role
`NovaFlowEC2SSMRole`:

```text
AmazonEC2ContainerServiceforEC2Role
```

Keep these existing policies too:

```text
AmazonSSMManagedInstanceCore
AmazonEC2ContainerRegistryReadOnly
CloudWatch log permissions
Parameter Store read permissions
```

### 3. Install And Configure The ECS Agent On Ubuntu

On the EC2 instance, install the ECS agent and configure it to join the cluster.
Run this through Systems Manager Run Command if you do not want to use SSH:

```sh
set -eu

AWS_REGION=us-east-1
ECS_CLUSTER=novaflow-production

sudo mkdir -p /etc/ecs
cat <<EOF | sudo tee /etc/ecs/ecs.config
ECS_CLUSTER=$ECS_CLUSTER
ECS_ENABLE_AWSLOGS_EXECUTIONROLE_OVERRIDE=true
ECS_AVAILABLE_LOGGING_DRIVERS=["json-file","awslogs"]
EOF

curl -fsSL \
  -o /tmp/amazon-ecs-init.deb \
  "https://s3.${AWS_REGION}.amazonaws.com/amazon-ecs-agent-${AWS_REGION}/amazon-ecs-init-latest.amd64.deb"

sudo dpkg -i /tmp/amazon-ecs-init.deb
sudo systemctl daemon-reload
sudo systemctl enable ecs
sudo systemctl restart ecs

sleep 5
sudo systemctl status ecs --no-pager || true
curl -s http://localhost:51678/v1/metadata || true
```

The important config file is:

```text
/etc/ecs/ecs.config
```

It should contain:

```properties
ECS_CLUSTER=novaflow-production
ECS_ENABLE_AWSLOGS_EXECUTIONROLE_OVERRIDE=true
```

Then restart the ECS agent.

After the agent starts, the EC2 instance should appear in:

```text
ECS -> Clusters -> novaflow-production -> Infrastructure -> Container instances
```

### 4. Create The ECS Task Execution Role

Create an IAM role named:

```text
ecsTaskExecutionRole
```

Trusted entity:

```text
Elastic Container Service Task
```

Attach:

```text
AmazonECSTaskExecutionRolePolicy
```

This lets ECS pull images from ECR and publish task logs to CloudWatch Logs.
The task definition uses the existing `/novaflow/production` log group so this
managed policy is enough for the pilot.

### 5. Update Security Groups For Dynamic ECS Ports

For the pilot task definition, `hostPort` is `0`. That means ECS dynamically
chooses a free high port on the EC2 host for the frontend container. This allows
rolling deployments because old and new frontend tasks can run at the same time.

Update the EC2 security group `novaflow-ec2-from-alb`:

```text
Type: Custom TCP
Port range: 32768-65535
Source: novaflow-alb-public security group
```

Keep the existing `8081` rule from the ALB for `api-gateway`.

After `novafront` is fully moved to ECS and Docker Compose no longer exposes the
frontend on host port `3000`, the old `3000` rule can be removed.

### 6. Use An Instance Target Group

Use the existing frontend target group if it is target type `instance`, or create
a new one:

```text
Name: novaflow-frontend-ecs-tg
Target type: Instance
Protocol: HTTP
Port: 80
Health check path: /
Success codes: 200-399
```

When ECS creates tasks, it registers the EC2 instance plus the dynamic host port
in this target group automatically.

## Register The Task Definition

Copy `novafront-task-definition.ec2.json`, then make sure the image uses the
latest successful frontend image tag:

```text
IMAGE_TAG
```

Then register it:

```sh
aws ecs register-task-definition \
  --region us-east-1 \
  --cli-input-json file://builder/ecs/novafront-task-definition.ec2.json
```

Use the latest successful `IMAGE_TAG` from GitHub Actions, or copy the tag from
the ECR `novaflow/novafront` repository.

## Create The Service

Copy `novafront-service.ec2.json`, replace:

```text
FRONTEND_TARGET_GROUP_ARN
```

Then create the service:

```sh
aws ecs create-service \
  --region us-east-1 \
  --cli-input-json file://builder/ecs/novafront-service.ec2.json
```

Wait for the ECS service to show one running task and for the target group to
show healthy.

## Cutover Notes

During the pilot, the old Docker Compose `novafront` container may still be
running on host port `3000`. That is okay while testing, but it means the
frontend target group can briefly contain both the old Compose frontend and the
new ECS frontend.

Once ECS `novafront` is healthy:

1. Remove or deregister the old `i-...:3000` target from the frontend target
   group if it is still registered.
2. Stop the Compose frontend on EC2:

```sh
cd /home/ubuntu/apps/novaflow
docker compose \
  --env-file /tmp/rendered-env-file \
  -f builder/production-release/docker-compose.production.yml \
  stop novafront
```

The exact env file is temporary during SSM deploys, so for normal operations use
the production deploy script or an SSM command that renders parameters first.

The next code step after the ECS pilot is to update the GitHub workflow so:

- it still builds and pushes `novafront` to ECR;
- it registers a new ECS task definition revision for `novafront`;
- it tells ECS to update the `novafront` service;
- the EC2 Compose deploy skips `novafront`.

Do not make that workflow change until the manual ECS service is proven healthy.

## Backend Migration

After `novafront` is healthy in ECS, the next migration is the backend group:

```text
rabbitmq
eureka
config-server
user-service
idea-service
ai-service
chat-service
email-service
api-gateway
```

For the first backend ECS move, these containers stay together in one ECS task.
That is deliberate. The current backend expects Docker names such as `rabbitmq`,
`eureka`, and `config-server`. A grouped ECS task keeps those names available
with Docker links while we move service ownership from Docker Compose to ECS.

The ALB only talks to `api-gateway`. RabbitMQ, Eureka, config-server, and the
application services stay private inside the ECS task.

```text
Browser
  |
  v
ALB :80/:443
  |
  +-- /api/*, /oauth2/*, /login/oauth2/* -> ECS backend task, api-gateway:8081
  |
  +-- everything else -> ECS novafront task, novafront:80

EC2 instance
  |
  +-- ECS agent runs frontend and backend tasks from ECR
  |
  +-- RDS stores PostgreSQL data
```

### Backend IAM Permission

The backend ECS task reads application settings from Parameter Store. Attach this
inline policy to `ecsTaskExecutionRole`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadNovaFlowProductionEnv",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:us-east-1:270023013144:parameter/novaflow/production/env/*"
    }
  ]
}
```

Keep `AmazonECSTaskExecutionRolePolicy` attached too. That managed policy lets
ECS pull from ECR and write logs to CloudWatch.

### Prepare RabbitMQ Storage

The ECS backend task uses a host directory for RabbitMQ data:

```text
/home/ubuntu/apps/novaflow/ecs-data/rabbitmq
```

Create it through SSM Run Command:

```sh
set -eu
sudo mkdir -p /home/ubuntu/apps/novaflow/ecs-data/rabbitmq
sudo chown -R 999:999 /home/ubuntu/apps/novaflow/ecs-data/rabbitmq
```

If RabbitMQ has important queued messages, drain or migrate them before the
cutover. For normal NovaFlow registration email events, it is usually better to
cut over with an empty RabbitMQ queue once email is known to work.

### Register The Backend Task Definition

Copy `novaflow-backend-task-definition.ec2.json` and replace:

```text
IMAGE_TAG
```

Use the current image tag from the latest successful production deploy.

Register it:

```sh
aws ecs register-task-definition \
  --region us-east-1 \
  --cli-input-json file://builder/ecs/novaflow-backend-task-definition.ec2.json
```

If you do this from the AWS console instead, go to:

```text
ECS -> Task definitions -> Create new task definition -> Create using JSON
```

Paste the rendered JSON there.

### Create The Backend Service

Copy `novaflow-backend-service.ec2.json` and replace:

```text
API_GATEWAY_TARGET_GROUP_ARN
```

Use the ARN for:

```text
novaflow-api-gateway-tg
```

Create the service:

```sh
aws ecs create-service \
  --region us-east-1 \
  --cli-input-json file://builder/ecs/novaflow-backend-service.ec2.json
```

In the console, choose:

```text
Cluster: novaflow-production
Launch type: EC2
Scheduling strategy: Replica
Desired tasks: 1
Deployment strategy: Rolling update
Circuit breaker: enabled, rollback enabled
Load balancer: existing novaflow-alb
Listener: HTTPS:443
Target group: existing novaflow-api-gateway-tg
Container: api-gateway 8081:8081
```

The console may display `8081:8081` even though the task definition uses dynamic
host ports. That is okay. ECS registers the real host port in the target group
after the task starts.

### Cut Over The Backend

Wait for `novaflow-api-gateway-tg` to show a new healthy ECS target on a high
port such as `32777`.

Then test:

```sh
curl -sk https://novaflow.dotze.co.za/api/auth/google/status
```

Expected:

```json
{"enabled":true}
```

Once the ECS backend target is healthy:

1. Deregister the old fixed `i-...:8081` target from `novaflow-api-gateway-tg`.
2. Stop the old Compose backend containers through SSM:

```sh
set -eu
cd /home/ubuntu/apps/novaflow
docker stop api-gateway user-service idea-service ai-service chat-service email-service config-server eureka-server rabbitmq || true
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

3. Leave the old Docker volumes in place until the ECS backend has survived a
   few deploys.

On the current `t3.small`, the backend ECS service is configured with:

```text
minimumHealthyPercent: 0
maximumPercent: 100
```

That avoids needing enough memory for two complete backend task copies during a
deployment. The tradeoff is that backend ECS updates can have a short gap while
the old task stops and the new task starts. For no-downtime backend releases,
move to a larger instance, add a second ECS instance, or move the backend to
Fargate.
