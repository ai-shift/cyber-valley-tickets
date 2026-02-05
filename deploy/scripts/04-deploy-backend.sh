#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

require_env_vars TARGET_HOST

SSH_TARGET="${SSH_TARGET:-root@$TARGET_HOST}"

echo "==> Deploying backend to ${TARGET_HOST}..."

echo "Syncing backend code..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='.venv' \
  --exclude='*.pyc' \
  --exclude='.pytest_cache' \
  --exclude='ethereum_artifacts' \
  ../backend/ "$SSH_TARGET":/home/tickets/backend/

echo "Syncing ethereum artifacts..."
rsync -avz --delete \
  ../ethereum/artifacts/ "$SSH_TARGET":/home/tickets/backend/ethereum_artifacts/

# Refresh runtime environment file from deploy/.env
bash -c "grep -v '^TARGET_' .env | grep -v '^DOMAIN_NAME' | grep -v '^#' | grep -v '^\$\$'" | \
  ssh "$SSH_TARGET" "cat > /etc/env/tickets.env"

ssh "$SSH_TARGET" bash <<'EOF_REMOTE'
set -euo pipefail

chown -R tickets:tickets /home/tickets/backend

su - tickets <<'TICKETS_CMDS'
set -euo pipefail
cd /home/tickets/backend
/home/tickets/.local/bin/uv sync
set -a
source /etc/env/tickets.env
set +a
/home/tickets/.local/bin/uv run python manage.py migrate
TICKETS_CMDS

systemctl daemon-reload
systemctl restart tickets-backend tickets-indexer tickets-telegram
systemctl status tickets-backend tickets-indexer tickets-telegram --no-pager
EOF_REMOTE

echo "==> Backend deploy complete"
