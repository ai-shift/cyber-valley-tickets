#!/bin/bash
set -euo pipefail

echo "==> Building and deploying frontend..."

# Build frontend locally
echo "Building frontend..."
cd ../client
pnpm install
pnpm build
echo "✓ Frontend built"

# rsync to server
echo "Syncing frontend to ${TARGET_HOST}..."
rsync -avz --delete \
  dist/ ${SSH_TARGET:-root@$TARGET_HOST}:/home/tickets/client/dist/

# Set ownership
ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
chown -R tickets:tickets /home/tickets/client
echo "✓ Frontend ownership set"
EOF

echo "==> Frontend deployment complete"
