# NovaFlow

NovaFlow is a single Gradle multi-project repository containing the Spring
services, React frontend, shared configuration, and local infrastructure.

## Modules

- `config-server` - Spring Cloud Config server
- `api-gateway` - API gateway and authentication boundary
- `user-service` - users and login
- `idea-service` - idea persistence and orchestration
- `ai-service` - OpenAI-backed planning and analysis
- `chat-service` - chat workflows
- `email-service` - email delivery
- `novafront` - React and Vite frontend

Supporting directories:

- `common-config` - externalized Spring configuration
- `builder` - Docker infrastructure and local development documentation
- `eureka` - legacy Eureka Docker configuration

## Build

Use the root wrapper for every module:

```powershell
.\gradlew.bat backendClasses
.\gradlew.bat backendBuild
.\gradlew.bat buildAll
```

Open this repository root in IntelliJ and import `settings.gradle`. Run
`NovaFlow - Infrastructure`, followed by `NovaFlow - All Local Apps`.

See [builder/LOCAL_DEVELOPMENT.md](builder/LOCAL_DEVELOPMENT.md) for ports and
startup details.
