# NovaFlow User Service

The user service owns registration, authentication, account activation,
password reset tokens, and collaborator invitations.

Email is not sent from this service. Registration, password reset, and
invitation workflows publish a durable `EmailNotification` to RabbitMQ. The
email service consumes that message and performs SMTP delivery asynchronously.

## Local development

Start `NovaFlow - Infrastructure` before this service so PostgreSQL, RabbitMQ,
Eureka, and the config server are available.

Run the service with:

```powershell
.\gradlew.bat :user-service:bootRun
```

The development seed account is:

```text
Username: admin
Password: admin
```

RabbitMQ defaults to `localhost:5672` with the `novaflow` development
credentials. These values can be overridden with `RABBITMQ_HOST`,
`RABBITMQ_PORT`, `RABBITMQ_USERNAME`, and `RABBITMQ_PASSWORD`.

## Tests

Run unit and mocked publisher tests:

```powershell
.\gradlew.bat :user-service:test
```

Run the Testcontainers registration test with isolated PostgreSQL and RabbitMQ:

```powershell
.\gradlew.bat :user-service:integrationTest
```

The integration test calls the public registration endpoint, verifies the
database row, and reads the resulting activation notification from RabbitMQ.
