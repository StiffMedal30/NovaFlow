# Local development with IntelliJ

Open `C:\git\play-ground\novaflow` as the IntelliJ project and import the root
`settings.gradle`. IntelliJ will load every backend and the frontend into one
window as modules of the `novaflow` Gradle build.

## Start the stack

1. Run `NovaFlow - Infrastructure`.
2. Wait for PostgreSQL on port `5432` and Eureka on port `8761`.
3. Run `NovaFlow - All Local Apps`.

The compound configuration starts the config server, all Spring services, and
the Vite frontend. The services retry config-server startup while it becomes
available.

Use the root Gradle wrapper for command-line builds:

```powershell
.\gradlew.bat backendClasses
.\gradlew.bat backendBuild
.\gradlew.bat buildAll
```

The AI service reads `OPENAI_API_KEY` from `ai-service/.env`. The Docker
infrastructure configuration reads database values from `builder/.env`.

## Local ports

| Process | Port |
| --- | ---: |
| Frontend | 3000 |
| PostgreSQL | 5432 |
| Config server | 7090 |
| Email service | 8050 |
| API gateway | 8081 |
| User service | 8082 |
| Idea service | 8083 |
| AI service | 8084 |
| Chat service | 8085 |
| Eureka | 8761 |

The Spring service ports can be overridden with `SERVER_PORT`, but the shared
IntelliJ configurations pin the values above to prevent accidental conflicts.

If an IntelliJ launch reports that a port is already in use, stop any service
instances previously started from a terminal before running the compound
configuration.
