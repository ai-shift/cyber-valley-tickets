#!/bin/bash
set -euo pipefail

echo "==> Setting up Tracer on ${TARGET_HOST}..."

# Check if TRACER_API_KEY is set
if [ -z "${TRACER_API_KEY:-}" ]; then
    echo "ERROR: TRACER_API_KEY not set in .env file"
    exit 1
fi

echo "✓ Using tracer API key from .env"

# Download and install tracer-collector binary
echo "Downloading tracer-collector binary..."
ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
set -euo pipefail

# TODO: Use official install script when available at github.com/ai-shift/tracer
# For now, download latest binary from GitHub releases
TRACER_VERSION="latest"
ARCH="$(uname -m)"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"

# Map architecture names
case "$ARCH" in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
    armv7l) ARCH="armv7" ;;
esac

# Try to download from GitHub releases (when available)
DOWNLOAD_URL="https://github.com/ai-shift/tracer/releases/latest/download/tracer-collector-${OS}-${ARCH}"

if curl -sSfL "$DOWNLOAD_URL" -o /usr/local/bin/tracer-collector 2>/dev/null; then
    echo "✓ Downloaded tracer-collector from GitHub"
else
    echo "⚠ GitHub release not available, checking for pre-installed binary..."
    if [ ! -f /usr/local/bin/tracer-collector ]; then
        echo "ERROR: Could not download tracer-collector binary"
        echo "Please install manually or check https://github.com/ai-shift/tracer"
        exit 1
    else
        echo "✓ Using existing tracer-collector binary"
    fi
fi

chmod +x /usr/local/bin/tracer-collector
echo "✓ tracer-collector binary installed"
EOF

# Create tracer config directory
ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
mkdir -p /etc/tracer
EOF

# Upload collector config with API key
cat templates/collector.toml | \
  sed "s|<API_KEY>|${TRACER_API_KEY}|g" | \
  ssh ${SSH_TARGET:-root@$TARGET_HOST} "cat > /etc/tracer/collector.toml"

echo "✓ Tracer config created"

# Install systemd service
scp templates/tracer-collector.service ${SSH_TARGET:-root@$TARGET_HOST}:/etc/systemd/system/

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
systemctl daemon-reload
systemctl enable tracer-collector
systemctl start tracer-collector

# Wait for connection
echo "Waiting for tracer collector to connect..."
for i in {1..10}; do
  if systemctl is-active --quiet tracer-collector; then
    echo "✓ Tracer collector is running"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "WARNING: Tracer collector may not be running properly"
    systemctl status tracer-collector --no-pager || true
  fi
  sleep 1
done
EOF

echo "==> Tracer setup complete"
echo "Check logs at: https://tracer.aishift.co"
