# Local development with IntelliJ

Open `C:\git\play-ground\novaflow` as the IntelliJ project and import the root
`settings.gradle`. IntelliJ will load every backend and the frontend into one
window as modules of the `novaflow` Gradle build.

## Start the stack

1. Start Docker Desktop or Rancher Desktop.
2. On the first checkout, or after changing `config-server`, run
   `NovaFlow - Build Config Server Image`.
3. Run `NovaFlow - Infrastructure`.
4. Wait for PostgreSQL on `5432`, RabbitMQ on `5672`, Eureka on `8761`, and
   the config server on `7090`.
5. Run `NovaFlow - All Local Apps`.

The infrastructure configuration starts PostgreSQL, RabbitMQ, Mailpit, Eureka,
and the config server in Docker. The compound application configuration starts
the remaining Spring services and the Vite frontend locally.

Use the root Gradle wrapper for command-line builds:

```powershell
.\gradlew.bat backendClasses
.\gradlew.bat backendBuild
.\gradlew.bat buildAll
```

These aggregate build tasks exclude `config-server`. Build its Docker image
separately:

```powershell
.\gradlew.bat configServerImage
```

Build output is stored in each module's `target` directory. Backend jars are
created under `<service>/target/libs`, and the frontend production bundle is
written to `novafront/target`.

The AI service reads `OPENAI_API_KEY` from `ai-service/.env`. Copy
`builder/.env.example` to `builder/.env` for the Docker infrastructure values.

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

RabbitMQ management is available at `http://localhost:15672` using the
credentials from `builder/.env`. Development emails are available at
`http://localhost:8025`.

The Spring service ports can be overridden with `SERVER_PORT`, but the shared
IntelliJ configurations pin the values above to prevent accidental conflicts.

If an IntelliJ launch reports that a port is already in use, stop any service
instances previously started from a terminal before running the compound
configuration.
