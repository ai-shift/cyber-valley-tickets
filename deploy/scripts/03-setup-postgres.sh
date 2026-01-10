#!/bin/bash
set -euo pipefail

echo "==> Setting up PostgreSQL on ${TARGET_HOST}..."

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<EOF
set -euo pipefail

# Install PostgreSQL (available version)
echo "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-client
systemctl enable postgresql
systemctl start postgresql
PG_VERSION=\$(psql --version | grep -oP '\d+' | head -1)
echo "✓ PostgreSQL \$PG_VERSION installed"

# Create database user
echo "Creating database user and database..."
sudo -u postgres psql <<PSQL
-- Create user if not exists
DO \\\$\\\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${POSTGRES_USER}') THEN
        CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
    END IF;
END
\\\$\\\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
PSQL

echo "✓ Database user and database created"

# Configure pg_hba.conf for local connections
PG_VERSION=\$(psql --version | grep -oP '\d+' | head -1)
PG_HBA="/etc/postgresql/\$PG_VERSION/main/pg_hba.conf"
if [ -f "\$PG_HBA" ]; then
    if ! grep -q "host.*${POSTGRES_DB}.*${POSTGRES_USER}" \$PG_HBA; then
        echo "host    ${POSTGRES_DB}    ${POSTGRES_USER}    127.0.0.1/32    md5" >> \$PG_HBA
        systemctl restart postgresql
        echo "✓ Configured pg_hba.conf"
    fi
else
    echo "⚠ pg_hba.conf not found at expected location, using defaults"
fi

echo "✓ PostgreSQL setup complete"
EOF

echo "==> PostgreSQL setup complete"
