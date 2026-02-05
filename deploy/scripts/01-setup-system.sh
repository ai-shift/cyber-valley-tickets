#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

require_env_vars TARGET_HOST DOMAIN_NAME POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB

SSH_TARGET="${SSH_TARGET:-root@$TARGET_HOST}"

echo "==> One-time system setup on ${TARGET_HOST}..."

echo "Uploading systemd service templates..."
scp templates/tickets-backend.service "$SSH_TARGET":/etc/systemd/system/
scp templates/tickets-indexer.service "$SSH_TARGET":/etc/systemd/system/
scp templates/tickets-telegram.service "$SSH_TARGET":/etc/systemd/system/

echo "Running remote setup tasks..."
ssh "$SSH_TARGET" bash <<REMOTE
set -euo pipefail

if [ "\$(id -u)" -ne 0 ]; then
  echo "ERROR: setup must run as root on remote host"
  exit 1
fi

apt-get update

# Core dependencies for services and containers
apt-get install -y podman slirp4netns uidmap fuse-overlayfs curl gnupg \
  postgresql postgresql-client redis-tools

# Caddy repository and install
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy
systemctl enable caddy

mkdir -p /etc/caddy/sites /etc/env
if ! grep -q "import sites/\\*" /etc/caddy/Caddyfile; then
  echo "import sites/*" >> /etc/caddy/Caddyfile
fi

# tickets user and dirs
if ! id -u tickets >/dev/null 2>&1; then
  useradd -m -s /bin/bash tickets
fi
mkdir -p /home/tickets/backend /home/tickets/client/dist
chown -R tickets:tickets /home/tickets

# Keep parity with previous behavior: tickets can manage app services and read logs
cat > /etc/sudoers.d/tickets <<'SUDOERS'
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl start tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl status tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl enable tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl disable tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/journalctl
SUDOERS
chmod 440 /etc/sudoers.d/tickets

# Install uv for tickets user (idempotent)
su - tickets -c 'command -v /home/tickets/.local/bin/uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh'

# PostgreSQL init
systemctl enable postgresql
systemctl start postgresql
sudo -u postgres psql <<PSQL
DO \\\$\\\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${POSTGRES_USER}') THEN
        CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
    END IF;
END
\\\$\\\$;

SELECT 'CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\\gexec

GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
PSQL

# Valkey preferred, redis fallback
if apt-cache show valkey-server >/dev/null 2>&1; then
  apt-get install -y valkey-server
  CACHE_SERVICE="valkey-server"
else
  apt-get install -y redis-server
  CACHE_SERVICE="redis-server"
fi
systemctl enable "\$CACHE_SERVICE"
systemctl restart "\$CACHE_SERVICE"

# IPFS container
podman stop cvland-ipfs >/dev/null 2>&1 || true
podman rm cvland-ipfs >/dev/null 2>&1 || true
podman volume create ipfs-data >/dev/null 2>&1 || true
podman volume create ipfs-staging >/dev/null 2>&1 || true
podman run -d \
  --name cvland-ipfs \
  --restart always \
  -p 5001:5001 \
  -p 8110:8080 \
  -p 4001:4001 \
  -v ipfs-data:/data/ipfs \
  -v ipfs-staging:/staging \
  --memory 300m \
  docker.io/ipfs/kubo:v0.25.0 >/dev/null

# Ganache container
podman stop ganache-node >/dev/null 2>&1 || true
podman rm ganache-node >/dev/null 2>&1 || true
podman run -d \
  --name ganache-node \
  --restart always \
  -p 8120:8545 \
  docker.io/trufflesuite/ganache:v7.9.2 \
  --chain.chainId 1337 \
  --wallet.accounts=0xc631efb34d5ac643c79eb1bad6e88589fbd1e29236cd8a145fd48283ae52bb05,0X56BC75E2D63100000 \
  --wallet.accounts=0x39e6d142076a3898e7533b9095d0ac78867d6642a9c172b4a1bf41e32980263d,0X56BC75E2D63100000 \
  --wallet.accounts=0xf47ff34e4ac62439d984e415b48676bda8698ef2603d6bf984d0ebe1ba7d5e07,0X56BC75E2D63100000 \
  --wallet.accounts=0xa712ac767d58175ee0856679b6fb845bf1231b051e0531fcdac63b0b9476de3d,0X56BC75E2D63100000 \
  --wallet.accounts=0x96642ec34cca1c611b5b02547fe296f11b07c9dfc427f8c01cd6fb028f720dd4,0X56BC75E2D63100000 \
  --wallet.accounts=0x9a59fdc205c8635868675af4a68085aa8c5bf92baa8a9287eb3356b0e67f1b69,0X56BC75E2D63100000 >/dev/null

systemctl daemon-reload
systemctl enable tickets-backend tickets-indexer tickets-telegram

echo "✓ Remote system setup completed"
REMOTE

echo "Uploading Caddy site config..."
sed "s|{{DOMAIN_NAME}}|${DOMAIN_NAME}|g" templates/Caddyfile | \
  ssh "$SSH_TARGET" "cat > /etc/caddy/sites/${DOMAIN_NAME}"

ssh "$SSH_TARGET" "caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy"

# Keep env file creation simple and built-in
bash -c "grep -v '^TARGET_' .env | grep -v '^DOMAIN_NAME' | grep -v '^#' | grep -v '^\$\$'" | \
  ssh "$SSH_TARGET" "cat > /etc/env/tickets.env"

echo "==> System setup complete"
