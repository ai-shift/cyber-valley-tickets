#!/bin/bash
set -euo pipefail

echo "==> Deploying backend to ${TARGET_HOST}..."

# rsync backend code to server
echo "Syncing backend code..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='.venv' \
  --exclude='*.pyc' \
  --exclude='.pytest_cache' \
  --exclude='ethereum_artifacts' \
  ../backend/ ${SSH_TARGET:-root@$TARGET_HOST}:/home/tickets/backend/

echo "✓ Backend code synced"

# Deploy ethereum artifacts separately (real files, not symlink)
echo "Syncing ethereum artifacts..."
rsync -avz \
  ../ethereum/artifacts/ ${SSH_TARGET:-root@$TARGET_HOST}:/home/tickets/backend/ethereum_artifacts/

echo "✓ Ethereum artifacts synced"

# Install dependencies and run migrations
ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<EOF
set -euo pipefail

# Set ownership
chown -R tickets:tickets /home/tickets/backend

# Install dependencies as tickets user
echo "Installing Python dependencies..."
su - tickets -c 'cd /home/tickets/backend && /home/tickets/.local/bin/uv sync'
echo "✓ Dependencies installed"

# Note: Environment file /etc/env/tickets.env should be created manually
if [ ! -f /etc/env/tickets.env ]; then
    echo "⚠ WARNING: /etc/env/tickets.env does not exist"
    echo "  Please create it manually with all required environment variables"
    echo "  See deploy/.env.example for reference"
else
    echo "✓ Environment file exists"

    # Run database migrations if env file exists
    echo "Running database migrations..."
    cd /home/tickets/backend
    sudo -u tickets bash -c "cd /home/tickets/backend && export \$(cat /etc/env/tickets.env | xargs) && /home/tickets/.local/bin/uv run python manage.py migrate"
    echo "✓ Migrations complete"
fi

echo "✓ Backend deployment complete"
EOF

# Install systemd services
echo "Installing systemd services..."
scp templates/tickets-backend.service ${SSH_TARGET:-root@$TARGET_HOST}:/etc/systemd/system/
scp templates/tickets-indexer.service ${SSH_TARGET:-root@$TARGET_HOST}:/etc/systemd/system/
scp templates/tickets-reaper.service ${SSH_TARGET:-root@$TARGET_HOST}:/etc/systemd/system/
scp templates/tickets-telegram.service ${SSH_TARGET:-root@$TARGET_HOST}:/etc/systemd/system/

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
systemctl daemon-reload
systemctl enable tickets-backend tickets-indexer tickets-reaper tickets-telegram
echo "✓ Systemd services installed and enabled"
EOF

echo "==> Backend deployment complete"
