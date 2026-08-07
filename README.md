# NovaFlow

## Custom Gradle commands

Run these commands from the repository root. On macOS or Linux, replace
`.\gradlew.bat` with `./gradlew`.

### Required Docker infrastructure

Docker Desktop or Rancher Desktop must be running before starting NovaFlow.
The following containers must be up before any application service or the
frontend is started:

- `config-server`
- `eureka-server`
- `postgres`
- `rabbitmq`
- `mailpit`

On the first checkout, or after changing `config-server`, build its image:

```powershell
.\gradlew.bat configServerImage
```

Then start all required containers with the IntelliJ run configuration
`NovaFlow - Infrastructure`, or from the command line:

```powershell
docker compose --env-file builder/.env -f builder/docker-compose.local.yml up -d
```

Wait for the containers to be ready before starting the local applications. If you keep local secrets in a root `.env` instead of `builder/.env`, omit `--env-file builder/.env` from the command.

PostgreSQL creates `user_service_db`, `idea_service_db`, and `ai_service_db`
from `builder/init/init.sql` when its Docker volume is first created. Changes
to that script do not run automatically against an existing volume. Apply it
without deleting data with:

```powershell
Get-Content builder/init/init.sql -Raw |
    docker-compose -f builder/docker-compose.local.yml exec -T postgres `
        sh -c 'psql -U "$POSTGRES_USER" -d postgres'
```

| Command | Purpose |
| --- | --- |
| `.\gradlew.bat backendClasses` | Compile all locally run Spring services without running tests. |
| `.\gradlew.bat backendBuild` | Build and test all locally run Spring services. |
| `.\gradlew.bat buildAll` | Build all locally run Spring services and the frontend. |
| `.\gradlew.bat integrationTest` | Run the user and email service integration tests with Testcontainers. |
| `.\gradlew.bat :user-service:integrationTest` | Run only the user service integration tests with Testcontainers. |
| `.\gradlew.bat :email-service:integrationTest` | Run only the email service integration tests with Testcontainers. |
| `.\gradlew.bat configServerImage` | Build the config server executable JAR and Docker image. |
| `.\gradlew.bat :novafront:npmInstall` | Install frontend dependencies with `npm ci`. |
| `.\gradlew.bat :novafront:npmBuild` | Build the Vite frontend. |
| `.\gradlew.bat :novafront:npmDev` | Start the Vite development server. |

NovaFlow turns a rough idea into an actionable plan. An idea submitted by the
React frontend passes through the API gateway to the idea service, where it is
stored and sent to the AI service for planning and feasibility analysis.

This repository is a single Gradle multi-project build containing the frontend,
Spring services, shared configuration, and local Docker infrastructure.

## Current features

- Register with email/password or Google through the API gateway
- Activate new accounts through a single-use email link that expires after 24 hours
- Queue account, password reset, and invitation emails for asynchronous delivery
- Submit and save ideas
- Generate a prioritized, step-by-step execution plan with OpenAI
- Reopen recent ideas and continue working on their steps
- Track progress against generated idea steps
- Generate a country-specific feasibility study
- Download generated planning material as PDF
- Delete ideas and their saved planning history

## Project structure

| Module | Purpose |
| --- | --- |
| `novafront` | React and Vite frontend |
| `api-gateway` | Public API, routing, and authentication boundary |
| `user-service` | Users, login, JWT issuing, and the development seed user |
| `idea-service` | Idea persistence, steps, progress, and AI orchestration |
| `ai-service` | OpenAI planning, feasibility studies, and transcription |
| `chat-service` | Chat workflows |
| `email-service` | Asynchronous email delivery and templates |
| `notification-contracts` | Shared notification message contracts |
| `config-server` | Spring Cloud Config server, always run in Docker |
| `common-config` | Externalized development and production configuration |
| `builder` | Docker Compose files and build scripts |

## Prerequisites

- Java 17
- Docker Desktop or Rancher Desktop
- IntelliJ IDEA with Gradle support

The frontend Gradle tasks download a pinned Node.js and npm toolchain
automatically. A global Node.js installation is not required.

Use the checked-in Gradle wrapper where possible. The project wrapper uses
Gradle 8.14.3:

```powershell
.\gradlew.bat --version
```

## Configuration

NovaFlow reads configuration from environment variables. In GitHub, create an
environment named `dev`, then store sensitive values as environment secrets and
non-sensitive settings as environment variables. The
`.github/workflows/dev-environment.yml` workflow maps those GitHub values into
the names used by Gradle, Spring, and Docker Compose.

Required `dev` environment secrets:

| Secret | Used for |
| --- | --- |
| `POSTGRES_PASSWORD` | PostgreSQL password used by the container and, by default, Spring datasources. |
| `RABBITMQ_PASSWORD` | RabbitMQ default user password |
| `JWT_SECRET` | JWT signing key |
| `INTERNAL_SERVICE_KEY` | Gateway-to-user-service internal calls |

Optional secrets include `DB_PASSWORD` if it must differ from `POSTGRES_PASSWORD`,
`OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`,
`PGADMIN_DEFAULT_PASSWORD`, `EMAIL_USERNAME`, and `EMAIL_PASSWORD`. Common
GitHub environment variables are `POSTGRES_USER`, `DB_USERNAME`,
`RABBITMQ_USERNAME`, `JWT_EXPIRATION`, `FRONTEND_BASE_URL`, `PUBLIC_API_URL`,
`OPENAI_MODEL`, `GOOGLE_OAUTH_ENABLED`, `GOOGLE_CLIENT_ID`, and the email
transport settings from `.env.example`.

GitHub secrets are injected into GitHub-hosted execution contexts such as
Actions. They cannot be downloaded back to a normal laptop shell. For laptop
development, export the same variable names in your shell, configure them in
IntelliJ, or put equivalent values in an ignored local `.env` file. Gradle and
the Spring services read both `.env` and `builder/.env`; process environment
values still win when the same key is set in more than one place. The IntelliJ
Docker Compose run configuration uses `builder/.env`.

Add the OpenAI credentials to enable AI features:

```properties
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-5.2
```

The example file documents the complete set of local names:

```powershell
Copy-Item .env.example builder/.env
```

### Google sign-in

Google sign-in is optional and disabled by default. Configure these values as
GitHub `dev` environment variables/secrets, shell variables, IntelliJ
environment entries, or optional local `.env` fallback values:

```properties
GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
INTERNAL_SERVICE_KEY=novaflow-local-internal-key
```

In the Google Cloud OAuth client, add this authorized redirect URI:

```text
http://localhost:8081/login/oauth2/code/google
```

Use `http://localhost:3000` as the local authorized JavaScript origin. Keep
`INTERNAL_SERVICE_KEY` identical for the API gateway and user service. It
protects the internal Google account provisioning endpoint and must be changed
for a deployed environment.

Local `.env` files are ignored by Git. Their values are supplied at runtime and are
not copied into Docker images. Local email is captured by Mailpit, so SMTP
credentials are not required for development.

### Automated production deployment

The production deployment workflow builds NovaFlow images in GitHub Actions,
pushes them to GitHub Container Registry, then asks AWS Systems Manager to run
the deployment command on EC2. The EC2 host checks out the exact commit that
built those images and runs the existing rolling deployment script. Production
runtime configuration comes from AWS Systems Manager Parameter Store. The deploy
script renders those parameters into a temporary Docker Compose env file on EC2,
uses it for the release, and removes it afterwards. The workflow does not upload
database, Google, SMTP, OpenAI, RabbitMQ, or JWT secrets.

Prepare the EC2 host once:

1. Install Docker and make sure the deploy user can run `docker` without `sudo`.
2. Clone this repository on the host, for example at `/opt/novaflow`.
3. Store production runtime values in Parameter Store under
   `/novaflow/production/env`.
4. Install the AWS CLI on the host so the deploy can read registry credentials
   and runtime configuration from AWS Systems Manager Parameter Store.
5. Attach an EC2 IAM role with `AmazonSSMManagedInstanceCore`.
6. Add permission for the EC2 IAM role to read GHCR credentials and production
   runtime configuration:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/novaflow/production/ghcr/username",
        "arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/novaflow/production/ghcr/token",
        "arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/novaflow/production/env/*"
      ]
    }
  ]
}
```

If the `SecureString` parameters use a customer-managed KMS key instead of the
default AWS managed key, also grant the EC2 role `kms:Decrypt` for that key.

7. Store the GHCR pull credentials in Parameter Store:

| Parameter | Type | Purpose |
| --- | --- | --- |
| `/novaflow/production/ghcr/username` | `String` | GitHub username used by EC2 to pull container images. |
| `/novaflow/production/ghcr/token` | `SecureString` | GitHub token with `read:packages` access for pulling images from GHCR. |

8. Store production runtime values in Parameter Store.

Use one parameter per environment variable. Parameter names must be direct
children of `/novaflow/production/env` and must end in the exact env var name:

```text
/novaflow/production/env/DB_HOST
/novaflow/production/env/DB_PASSWORD
/novaflow/production/env/JWT_SECRET
```

Use `SecureString` for values that must stay secret:

```text
DB_PASSWORD
RABBITMQ_PASSWORD
JWT_SECRET
INTERNAL_SERVICE_KEY
OPENAI_API_KEY
GOOGLE_CLIENT_SECRET
PRODUCTION_EMAIL_PASSWORD
```

Use `String` for non-secret runtime settings:

```text
DB_HOST
DB_PORT
DB_USERNAME
USER_SERVICE_DB_NAME
IDEA_SERVICE_DB_NAME
AI_SERVICE_DB_NAME
USE_EXTERNAL_POSTGRES
RABBITMQ_USERNAME
JWT_EXPIRATION
FRONTEND_BASE_URL
PUBLIC_API_URL
OPENAI_BASE_URL
OPENAI_MODEL
OPENAI_REFINEMENT_MODEL
OPENAI_TRANSCRIPTION_MODEL
GOOGLE_OAUTH_ENABLED
GOOGLE_CLIENT_ID
PRODUCTION_EMAIL_HOST
PRODUCTION_EMAIL_PORT
PRODUCTION_EMAIL_USERNAME
PRODUCTION_EMAIL_SMTP_AUTH
PRODUCTION_EMAIL_STARTTLS
PRODUCTION_EMAIL_SSL_ENABLE
PRODUCTION_EMAIL_FROM_ADDRESS
PRODUCTION_EMAIL_FROM_NAME
CLOUDWATCH_LOG_REGION
CLOUDWATCH_LOG_GROUP
CLOUDWATCH_LOG_CREATE_GROUP
```

Example:

```sh
aws ssm put-parameter \
  --name /novaflow/production/env/DB_HOST \
  --type String \
  --value novaflow-postgres.xxxxxx.us-east-1.rds.amazonaws.com \
  --overwrite

aws ssm put-parameter \
  --name /novaflow/production/env/DB_PASSWORD \
  --type SecureString \
  --value 'replace-with-rds-password' \
  --overwrite
```

9. Add permission for the EC2 IAM role to write Docker container logs to
   CloudWatch Logs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:/novaflow/production",
        "arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:/novaflow/production:*"
      ]
    }
  ]
}
```

The production Compose file sends container logs to `/novaflow/production` by
default. These optional values can be added to Parameter Store when you want
different names or regions:

```properties
CLOUDWATCH_LOG_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=/novaflow/production
CLOUDWATCH_LOG_CREATE_GROUP=true
```

Create the log group yourself and set a retention period, such as 14 or 30 days,
if you do not want CloudWatch Logs to keep production logs forever.

10. Optional: move PostgreSQL to Amazon RDS.

NovaFlow can keep using the Docker PostgreSQL container, or it can connect to an
external PostgreSQL host such as Amazon RDS. When using RDS, create these
databases before restarting the services:

```sql
CREATE DATABASE user_service_db;
CREATE DATABASE idea_service_db;
CREATE DATABASE ai_service_db;
```

Then store these values in Parameter Store:

```properties
DB_HOST=novaflow-postgres.xxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=novaflow_admin
DB_PASSWORD=replace-with-rds-password
USER_SERVICE_DB_NAME=user_service_db
IDEA_SERVICE_DB_NAME=idea_service_db
AI_SERVICE_DB_NAME=ai_service_db
USE_EXTERNAL_POSTGRES=1
```

`USE_EXTERNAL_POSTGRES=1` tells the deploy script not to start the Docker
`postgres` service as an application dependency. When
`PRODUCTION_EMAIL_HOST` points at a real SMTP host instead of `mailpit`, the
deploy script also skips Mailpit as an application dependency.

After the services have been tested against RDS, migrate the existing Docker
PostgreSQL data into RDS from the EC2 host. The migration script stops app
services, dumps the old Docker databases, backs up the current RDS databases,
recreates the target `public` schemas, restores the dumps into RDS, and starts
the app services again:

```sh
cd /home/ubuntu/apps/novaflow
sudo apt install -y postgresql-client
SSM_ENV_PATH=/novaflow/production/env sh builder/production-release/migrate-postgres-to-rds.sh --yes
```

After the migration has been verified, clean up the EC2 host:

```sh
cd /home/ubuntu/apps/novaflow
sh builder/production-release/cleanup-ec2-after-aws-migration.sh --yes
```

This archives active `.env` files, removes unused `postgres`, `mailpit`, and
`pgadmin` containers, and prunes dangling Docker images/build cache. It keeps
the old Docker PostgreSQL volume as a rollback backup by default. To remove that
volume too after you are fully comfortable with RDS, rerun cleanup with:

```sh
sh builder/production-release/cleanup-ec2-after-aws-migration.sh --yes --delete-postgres-volume
```

The production admin scripts also support RDS mode when `psql` is installed on
the EC2 host:

```sh
sudo apt install -y postgresql-client
SEED_PASSWORD='change-me' SSM_ENV_PATH=/novaflow/production/env sh builder/production-release/seed-admin-user.sh
```

11. Confirm the manual deploy scripts work on the host:

```sh
cd /opt/novaflow
sh builder/production-release/build-images.sh novafront
SSM_ENV_PATH=/novaflow/production/env sh builder/production-release/deploy-stack.sh novafront
```

Create an AWS IAM role for GitHub Actions using GitHub OIDC. Because the
workflow uses the `production` GitHub environment, scope the trust policy to the
environment subject:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPOSITORY:environment:production"
        }
      }
    }
  ]
}
```

Attach a policy that allows the GitHub role to send and inspect SSM commands for
the production instance:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ssm:us-east-1::document/AWS-RunShellScript",
        "arn:aws:ec2:us-east-1:ACCOUNT_ID:instance/INSTANCE_ID"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations",
        "ssm:ListCommands"
      ],
      "Resource": "*"
    }
  ]
}
```

Create these GitHub Actions variables for the repository or the `production`
environment:

| Variable | Purpose |
| --- | --- |
| `PRODUCTION_AWS_ROLE_ARN` | IAM role ARN that GitHub Actions assumes through OIDC. May be stored as a secret instead. |
| `PRODUCTION_SSM_INSTANCE_ID` | EC2 instance ID for the production host. May be stored as a secret instead. |
| `PRODUCTION_AWS_REGION` | AWS region. Defaults to `us-east-1` when omitted. |
| `PRODUCTION_DEPLOY_PATH` | Absolute path to the EC2 checkout. Defaults to `/opt/novaflow` when omitted. |
| `PRODUCTION_DEPLOY_USER` | Linux user that owns the checkout and runs Docker. Defaults to `ubuntu` when omitted. |
| `PRODUCTION_GHCR_USERNAME_PARAMETER` | Optional Parameter Store name for the GHCR username. |
| `PRODUCTION_GHCR_TOKEN_PARAMETER` | Optional Parameter Store name for the GHCR token. |
| `PRODUCTION_SSM_ENV_PATH` | Optional Parameter Store path for production env values. Defaults to `/novaflow/production/env`. |

The workflow runs automatically on pushes to `main` or `master`, and can also be
started manually from the Actions tab. The manual run accepts a space-separated
service list such as:

```text
novafront api-gateway
```

Use `all`, or leave the input unchanged, to deploy the normal app release set:

```text
config-server user-service idea-service ai-service chat-service email-service api-gateway novafront
```

## Start with IntelliJ

Open the repository root in one IntelliJ window and import the root
`settings.gradle`. Wait for the Gradle sync to finish.

Start the application in this order:

1. Start Docker Desktop or Rancher Desktop.
2. On the first checkout, or after changing `config-server`, run
   `NovaFlow - Build Config Server Image`.
3. Run `NovaFlow - Infrastructure`.
4. Wait for PostgreSQL on `5432`, RabbitMQ on `5672`, Eureka on `8761`, and
   the config server on `7090`.
5. Run `NovaFlow - All Local Apps`.
6. Open [http://localhost:3000](http://localhost:3000).

`NovaFlow - Infrastructure` starts PostgreSQL, RabbitMQ, Mailpit, Eureka, and
the config server in Docker. `NovaFlow - All Local Apps` starts the remaining
Spring services and the frontend locally from IntelliJ.

The config server is always a Docker service and is never started by the local
application compound launcher.

## Development login

Liquibase inserts one development-only user when the user database is created:

```text
Username: admin
Password: admin
```

This account is seed data for local testing only. It is not production data and
must not be used in a deployed environment.

## Account activation

Manual registration and first-time Google sign-in follow the same lifecycle:

1. The user service creates the account in a disabled state.
2. It stores a hash of a random activation token and queues an activation email.
3. The email service sends the message asynchronously through RabbitMQ.
4. Clicking the link activates the account and redirects to the login page.
5. The link is rejected after activation or after 24 hours.

Passwords and raw activation tokens are never stored in plain text. In local
development, open Mailpit at [http://localhost:8025](http://localhost:8025) to
read and follow activation emails.

## Manual startup

The IntelliJ configurations are the simplest way to run the complete stack.
For terminal startup, keep each long-running command in its own terminal.

First build the config-server image. This is required after a fresh checkout
and whenever the config-server code changes:

```powershell
.\gradlew.bat configServerImage
```

Then start PostgreSQL, RabbitMQ, Mailpit, Eureka, and the config server:

```powershell
docker-compose -f builder/docker-compose.local.yml up -d
```

After all three infrastructure services are available, start the application
services in separate terminals:

```powershell
.\gradlew.bat :user-service:bootRun
.\gradlew.bat :idea-service:bootRun
.\gradlew.bat :ai-service:bootRun
.\gradlew.bat :chat-service:bootRun
.\gradlew.bat :email-service:bootRun
```

Start the gateway after the services:

```powershell
.\gradlew.bat :api-gateway:bootRun
```

Start the frontend last:

```powershell
.\gradlew.bat :novafront:npmDev
```

## Local ports

| Process | Port |
| --- | ---: |
| Frontend | 3000 |
| PostgreSQL | 5432 |
| RabbitMQ | 5672 |
| Config server | 7090 |
| Mailpit web UI | 8025 |
| Email service | 8050 |
| API gateway | 8081 |
| User service | 8082 |
| Idea service | 8083 |
| AI service | 8084 |
| Chat service | 8085 |
| Eureka | 8761 |

Useful local addresses:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API gateway: [http://localhost:8081](http://localhost:8081)
- Mailpit inbox: [http://localhost:8025](http://localhost:8025)
- RabbitMQ management: [http://localhost:15672](http://localhost:15672)
- Eureka dashboard: [http://localhost:8761](http://localhost:8761)

## Build and test

Build all locally run backend services and run their tests:

```powershell
.\gradlew.bat clean backendBuild
```

Run the fast unit and mocked tests for the asynchronous email flow:

```powershell
.\gradlew.bat :user-service:test :email-service:test
```

Run the Docker-based integration tests:

```powershell
.\gradlew.bat integrationTest
```

The integration suite starts isolated Testcontainers instances and verifies:

- Manual registration persists a disabled user, publishes an activation event,
  activates the user once, and rejects reuse of the link.
- Expired activation links cannot enable an account.
- First-time Google sign-in provisions a disabled Google account and publishes
  its activation event.
- The email service consumes a RabbitMQ event and delivers it through a real
  Mailpit SMTP server.
- Failed SMTP delivery is attempted three times before the original event is
  sent to `novaflow.email.delivery.dlq`.

Docker Desktop or Rancher Desktop must be running for `integrationTest`. The
normal `test` and `backendBuild` tasks do not run the container tests.

Build the locally run backend services and frontend:

```powershell
.\gradlew.bat clean buildAll
```

The aggregate `backendBuild`, `backendClasses`, and `buildAll` tasks exclude the
config server because it is deployed only as a Docker service. Build its image
separately with:

```powershell
.\gradlew.bat configServerImage
```

To build a new image and restart only one Docker service:

```powershell
.\gradlew.bat restartService -Pservice=user-service
```

This runs that module's build, rebuilds its Docker image, and recreates only the
named service from `builder/docker-compose.yml`. Its dependencies and the other
running services are left untouched. Valid names are `ai-service`,
`api-gateway`, `chat-service`, `config-server`, `email-service`, `idea-service`,
`user-service`, and `novafront`.

Compile the backend without running tests:

```powershell
.\gradlew.bat backendClasses
```

All generated output is written to each module's `target` directory. Runnable
Spring Boot jars are created under `<service>/target/libs`, and the frontend
production bundle is created under `novafront/target`.

## Troubleshooting

- If a service reports that its port is already in use, stop older terminal or
  Docker instances before using the IntelliJ compound launcher.
- If services cannot load configuration, confirm the config server is running
  in Docker on `7090`.
- If email notifications are not delivered, check RabbitMQ on `15672`, the
  `novaflow.email.delivery.dlq` queue, and the Mailpit inbox on `8025`.
- If database connections fail, confirm PostgreSQL is running and the runtime
  can read `POSTGRES_PASSWORD`; set `DB_PASSWORD` only when the Spring
  datasource password intentionally differs from the PostgreSQL password.
- If Eureka registration fails, confirm
  [http://localhost:8761](http://localhost:8761) is reachable.
- If AI requests fail, confirm `OPENAI_API_KEY` is present in the runtime
  environment.
