# Configuration

NovaFlow is configured through environment variables. Local development reads `.env` and `builder/.env`; production reads SSM Parameter Store and renders runtime values for deployment.

## Local Files

| File | Use |
| --- | --- |
| `.env` | Root environment used by Gradle and local service runs |
| `builder/.env` | Docker Compose environment used by local and builder scripts |
| `.env.example` | Safe template with no real secrets |

Keep `.env` and `builder/.env` in sync locally:

```powershell
Copy-Item .env builder/.env
```

Do not commit real `.env` values.

## Production Parameter Store

Production values live below:

```text
/novaflow/production/env
```

Each environment variable is stored as a direct child parameter:

```text
/novaflow/production/env/DB_HOST
/novaflow/production/env/JWT_SECRET
/novaflow/production/env/GOOGLE_CLIENT_ID
```

Use `SecureString` for passwords, tokens, and API keys. Use `String` for normal runtime configuration.

## Shared Infrastructure Variables

| Variable | Local example | Production note |
| --- | --- | --- |
| `DB_HOST` | `postgres` | RDS endpoint |
| `DB_PORT` | `5432` | Usually `5432` |
| `DB_USERNAME` | `sa` | RDS app user |
| `DB_PASSWORD` | `change-me` | SecureString |
| `USER_SERVICE_DB_NAME` | `user_service_db` | Database must exist in RDS |
| `IDEA_SERVICE_DB_NAME` | `idea_service_db` | Database must exist in RDS |
| `AI_SERVICE_DB_NAME` | `ai_service_db` | Database must exist in RDS |
| `USE_EXTERNAL_POSTGRES` | `0` | `1` for RDS |
| `RABBITMQ_USERNAME` | `novaflow` | RabbitMQ app user |
| `RABBITMQ_PASSWORD` | `change-me` | SecureString |

## Application Security

| Variable | Purpose | Secret |
| --- | --- | --- |
| `JWT_SECRET` | Signs application JWTs | Yes |
| `JWT_EXPIRATION` | Token lifetime in milliseconds | No |
| `INTERNAL_SERVICE_KEY` | Shared internal service auth key | Yes |
| `FRONTEND_BASE_URL` | Public frontend URL | No |
| `PUBLIC_API_URL` | Public API base URL | No |

Production values should normally be:

```env
FRONTEND_BASE_URL=https://novaflow.dotze.co.za
PUBLIC_API_URL=https://novaflow.dotze.co.za
```

## OpenAI

| Variable | Purpose | Secret |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `OPENAI_BASE_URL` | API base URL | No |
| `OPENAI_MODEL` | Main model | No |
| `OPENAI_REFINEMENT_MODEL` | Refinement model | No |
| `OPENAI_TRANSCRIPTION_MODEL` | Transcription model | No |

## Google OAuth

| Variable | Purpose | Secret |
| --- | --- | --- |
| `GOOGLE_OAUTH_ENABLED` | Enables/disables Google sign-in | No |
| `GOOGLE_CLIENT_ID` | OAuth client id | No |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Yes |

Production Google Cloud settings should include:

- Authorized JavaScript origin: `https://novaflow.dotze.co.za`
- Authorized redirect URI: `https://novaflow.dotze.co.za/login/oauth2/code/google`

## Email

Local email uses Mailpit:

```env
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SMTP_AUTH=false
EMAIL_STARTTLS=false
EMAIL_SSL_ENABLE=false
EMAIL_FROM_ADDRESS=no-reply@novaflow.local
EMAIL_FROM_NAME=NovaFlow
```

Production uses the real SMTP account. In Parameter Store the production values are stored with `PRODUCTION_EMAIL_*` names and mapped into the service runtime by the production deployment config.

| Production parameter | Purpose | Secret |
| --- | --- | --- |
| `PRODUCTION_EMAIL_HOST` | SMTP host | No |
| `PRODUCTION_EMAIL_PORT` | SMTP port | No |
| `PRODUCTION_EMAIL_USERNAME` | SMTP username | No |
| `PRODUCTION_EMAIL_PASSWORD` | SMTP password | Yes |
| `PRODUCTION_EMAIL_SMTP_AUTH` | SMTP auth enabled | No |
| `PRODUCTION_EMAIL_STARTTLS` | STARTTLS enabled | No |
| `PRODUCTION_EMAIL_SSL_ENABLE` | SSL enabled | No |
| `PRODUCTION_EMAIL_FROM_ADDRESS` | From address | No |
| `PRODUCTION_EMAIL_FROM_NAME` | From display name | No |

## CloudWatch And SSM

| Variable | Purpose |
| --- | --- |
| `CLOUDWATCH_LOG_REGION` | AWS region for CloudWatch logs |
| `CLOUDWATCH_LOG_GROUP` | Log group, usually `/novaflow/production` |
| `CLOUDWATCH_LOG_CREATE_GROUP` | Whether the log driver can create the group |
| `SSM_ENV_PATH` | Parameter path for production environment |
| `SSM_ENV_REGION` | Parameter Store region |

## Adding A New Variable

1. Add it to `.env.example`.
2. Add it to local `.env` and `builder/.env` if it is needed locally.
3. Add it to the production Parameter Store path if it is needed in production.
4. Add it to the relevant Docker Compose or ECS task definition.
5. Update this document.
6. Run the relevant build and integration tests.
