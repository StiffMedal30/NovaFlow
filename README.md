# NovaFlow

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
- Node.js and npm

Use the checked-in Gradle wrapper where possible. The project wrapper uses
Gradle 8.14.3:

```powershell
.\gradlew.bat --version
```

## Local configuration

Copy `builder/.env.example` to `builder/.env` for the Docker infrastructure:

```properties
POSTGRES_USER=sa
POSTGRES_PASSWORD=StiffMedal30
RABBITMQ_USERNAME=novaflow
RABBITMQ_PASSWORD=novaflow
```

The password must match the development datasource configuration under
`common-config`.

Create `ai-service/.env` to enable OpenAI features:

```properties
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-5.2
```

Both `.env` files are ignored by Git. Local email is captured by Mailpit, so
SMTP credentials are not required for development.

### Google sign-in

Google sign-in is optional and disabled by default. Copy
`api-gateway/.env.example` to `api-gateway/.env`, then configure:

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
docker-compose --env-file builder/.env -f builder/docker-compose.local.yml up -d
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
- If database connections fail, confirm PostgreSQL is running and the password
  in `builder/.env` matches the development configuration.
- If Eureka registration fails, confirm
  [http://localhost:8761](http://localhost:8761) is reachable.
- If AI requests fail, confirm `OPENAI_API_KEY` is present in
  `ai-service/.env`.
