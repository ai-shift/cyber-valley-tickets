#!/bin/bash
set -euo pipefail

# Source common functions
source "$(dirname "$0")/lib/common.sh"

# Validate required environment variables
require_env_vars TARGET_HOST

echo "==> Starting Ganache on ${TARGET_HOST}..."

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
set -euo pipefail

# Source common functions (if available on remote)
require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "ERROR: This script must be run as root"
        exit 1
    fi
}

require_root

# Stop existing container if running
podman stop ganache-node 2>/dev/null || true
podman rm ganache-node 2>/dev/null || true

# Run Ganache container with specific accounts (matching ethereum/Makefile)
# Note: No persistence to ensure fresh state on each restart
echo "Starting Ganache container..."
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
  --wallet.accounts=0x9a59fdc205c8635868675af4a68085aa8c5bf92baa8a9287eb3356b0e67f1b69,0X56BC75E2D63100000

echo "✓ Ganache container started"

# Wait for Ganache to be ready
echo "Waiting for Ganache to be ready..."
for i in {1..30}; do
  if curl -s -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://localhost:8120 &>/dev/null; then
    echo "✓ Ganache is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: Ganache failed to start"
    podman logs ganache-node
    exit 1
  fi
  sleep 1
done
EOF

echo "==> Ganache started successfully"
