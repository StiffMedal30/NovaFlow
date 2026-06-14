-- Keep this list aligned with the datasource URLs under common-config.
-- \gexec makes each CREATE DATABASE conditional, so this script is safe to
-- run manually against an existing PostgreSQL volume.

SELECT 'CREATE DATABASE user_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'user_service_db'
)\gexec

SELECT 'CREATE DATABASE idea_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'idea_service_db'
)\gexec

SELECT 'CREATE DATABASE ai_service_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'ai_service_db'
)\gexec
