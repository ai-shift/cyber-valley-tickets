#!/bin/bash
set -euo pipefail

# Source common functions
source "$(dirname "$0")/lib/common.sh"

# Validate required environment variables
require_env_vars TARGET_HOST

echo "==> Starting IPFS on ${TARGET_HOST}..."

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
podman stop cvland-ipfs 2>/dev/null || true
podman rm cvland-ipfs 2>/dev/null || true

# Create volumes if they don't exist
podman volume create ipfs-data 2>/dev/null || true
podman volume create ipfs-staging 2>/dev/null || true

# Run IPFS container
# Memory limit: 300MB to preserve server resources
# Using Kubo (formerly go-ipfs) v0.25.0 (latest stable as of 2024)
echo "Starting IPFS container..."
podman run -d \
  --name cvland-ipfs \
  --restart always \
  -p 5001:5001 \
  -p 8110:8080 \
  -p 4001:4001 \
  -v ipfs-data:/data/ipfs \
  -v ipfs-staging:/staging \
  --memory 300m \
  docker.io/ipfs/kubo:v0.25.0

echo "✓ IPFS container started"

# Wait for IPFS to be ready
echo "Waiting for IPFS to be ready..."
for i in {1..30}; do
  if podman exec cvland-ipfs ipfs id &>/dev/null; then
    echo "✓ IPFS is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: IPFS failed to start"
    podman logs cvland-ipfs
    exit 1
  fi
  sleep 1
done

# Set ownership of data directory
chown -R tickets:tickets /home/tickets/data/ipfs || true
EOF

echo "==> IPFS started successfully"
