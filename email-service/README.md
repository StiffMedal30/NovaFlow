# NovaFlow Email Service

The email service consumes durable email notifications from RabbitMQ and sends
the resulting HTML messages through SMTP. User registration, password reset,
and collaborator invitation flows publish messages and return without waiting
for SMTP delivery.

## Local development

Start `NovaFlow - Infrastructure` before this service. RabbitMQ is available on
`5672`, its management UI is at `http://localhost:15672`, and Mailpit captures
development email at `http://localhost:8025`.

The default local credentials are:

```text
RabbitMQ username: novaflow
RabbitMQ password: novaflow
SMTP host: localhost
SMTP port: 1025
```

No real SMTP credentials are required for local development. Copy
`.env.example` to `.env` only when overriding the defaults.

Run the service with:

```powershell
.\gradlew.bat :email-service:bootRun
```

## Delivery behavior

- Queue: `novaflow.email.delivery`
- Retry attempts: 4 with exponential backoff
- Dead-letter queue: `novaflow.email.delivery.dlq`
- Templates: `common-config/email-service`
- SMTP credentials: environment variables consumed only by this service

Messages are acknowledged only after SMTP delivery succeeds. A message that
still fails after retries is rejected to the dead-letter queue for inspection
or replay.

## Tests

Run unit tests with the mocked mail sender:

```powershell
.\gradlew.bat :email-service:test
```

Run the Testcontainers integration tests with real RabbitMQ and Mailpit
containers:

```powershell
.\gradlew.bat :email-service:integrationTest
```

The integration suite also uses a rejecting local SMTP server to verify three
delivery attempts and dead-letter routing.
