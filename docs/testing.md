# Testing

Use these checks before merging or deploying.

## Fast Backend Build

```powershell
.\gradlew.bat backendBuild
```

This builds the backend services and runs normal tests.

## Full Build

```powershell
.\gradlew.bat buildAll
```

This includes backend work and frontend build tasks wired into the repo.

## Integration Tests

```powershell
.\gradlew.bat integrationTest
```

Integration tests may require local infrastructure:

```powershell
docker compose --env-file builder/.env -f builder/docker-compose.local.yml up -d
```

## Service-Specific Tests

```powershell
.\gradlew.bat :user-service:test
.\gradlew.bat :user-service:integrationTest
.\gradlew.bat :email-service:integrationTest
```

Use service-specific tests when changing one service and the full `integrationTest` task before merging risky changes.

## Frontend Checks

```powershell
.\gradlew.bat :novafront:npmBuild
```

If working directly in `novafront`, the package scripts are:

```powershell
cd novafront
npm run build
npm run lint
```

## Docker Image Build

Build one service image:

```powershell
.\gradlew.bat serviceImage -Pservice=user-service
```

Build the config server image:

```powershell
.\gradlew.bat configServerImage
```

## CI Expectations

GitHub Actions should catch:

- Java compilation failures
- Backend unit and integration test failures
- Frontend build failures
- Docker image build failures
- Production deploy configuration failures

If CI fails in the SSM deploy step, read both SSM stdout and stderr. The short GitHub status line is often less useful than the command invocation output.
