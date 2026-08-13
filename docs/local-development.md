# Local Development

Use this when you want NovaFlow running on your machine without touching AWS.

## Prerequisites

- Java 17
- Docker Desktop or Rancher Desktop
- Node.js available to Gradle through the frontend build
- IntelliJ IDEA or another editor

## First Setup

Create local environment files:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example builder/.env
```

Build the config server image once:

```powershell
.\gradlew.bat configServerImage
```

Start local infrastructure:

```powershell
docker compose --env-file builder/.env -f builder/docker-compose.local.yml up -d
```

This starts PostgreSQL, RabbitMQ, Mailpit, Eureka, and the config server.

## Start The App

Start the backend services from IntelliJ or Gradle:

```powershell
.\gradlew.bat :user-service:bootRun
.\gradlew.bat :idea-service:bootRun
.\gradlew.bat :ai-service:bootRun
.\gradlew.bat :chat-service:bootRun
.\gradlew.bat :email-service:bootRun
.\gradlew.bat :api-gateway:bootRun
```

Start the frontend:

```powershell
.\gradlew.bat :novafront:npmDev
```

Open:

- Frontend: `http://localhost:3000`
- API gateway: `http://localhost:8081`
- Mailpit: `http://localhost:8025`
- RabbitMQ UI: `http://localhost:15672`
- Eureka: `http://localhost:8761`

## Local Ports

| Service | Port |
| --- | --- |
| Frontend | 3000 |
| PostgreSQL | 5432 |
| RabbitMQ | 5672 |
| RabbitMQ UI | 15672 |
| Config server | 7090 |
| Mailpit SMTP | 1025 |
| Mailpit UI | 8025 |
| Email service | 8050 |
| API gateway | 8081 |
| User service | 8082 |
| Idea service | 8083 |
| AI service | 8084 |
| Chat service | 8085 |
| Eureka | 8761 |

## Local Login

Development data can include an admin user:

- Username: `admin`
- Password: `admin`

Production seed scripts use explicit passwords and should not reuse this local default.

## Google OAuth Locally

For local Google sign-in, add these redirect settings in Google Cloud:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:8081/login/oauth2/code/google`

Set these in `.env` and copy to `builder/.env`:

```env
GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_BASE_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:8081
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Services cannot read config | Confirm `config-server` is running on port 7090 |
| Services cannot discover each other | Confirm Eureka is running on port 8761 |
| Emails do not arrive | Check Mailpit at `http://localhost:8025` |
| Login works by service port but fails through gateway | Check API gateway route and frontend `PUBLIC_API_URL` |
| Database connection fails | Confirm PostgreSQL is running and `.env` matches `builder/.env` |
| IntelliJ says React files are broken | IntelliJ Community may not understand React/TS well; run the Gradle/Vite build to verify |

More detailed local notes live in [builder/LOCAL_DEVELOPMENT.md](../builder/LOCAL_DEVELOPMENT.md).
