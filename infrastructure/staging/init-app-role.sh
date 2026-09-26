#!/bin/bash
set -euo pipefail

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -v ON_ERROR_STOP=1 -v app_password="$POSTGRES_APP_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE titan_app LOGIN PASSWORD %L', :'app_password') \gexec
GRANT CONNECT ON DATABASE titan_staging TO titan_app;
GRANT USAGE ON SCHEMA public TO titan_app;
ALTER DEFAULT PRIVILEGES FOR ROLE titan_migrator IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO titan_app;
ALTER DEFAULT PRIVILEGES FOR ROLE titan_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO titan_app;
ALTER DEFAULT PRIVILEGES FOR ROLE titan_migrator IN SCHEMA public
    GRANT USAGE ON TYPES TO titan_app;
SQL
