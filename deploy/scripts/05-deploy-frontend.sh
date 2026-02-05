#!/bin/bash
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

require_env_vars TARGET_HOST

SSH_TARGET="${SSH_TARGET:-root@$TARGET_HOST}"

echo "==> Building frontend locally..."
(
  cd ../client
  pnpm build
)

echo "==> Syncing frontend dist to ${TARGET_HOST}..."
rsync -avz --delete \
  ../client/dist/ "$SSH_TARGET":/home/tickets/client/dist/

ssh "$SSH_TARGET" "chown -R tickets:tickets /home/tickets/client"

echo "==> Frontend deploy complete"
