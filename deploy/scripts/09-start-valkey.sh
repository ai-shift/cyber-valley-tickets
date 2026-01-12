#!/bin/bash
set -euo pipefail

# Source common functions
source "$(dirname "$0")/lib/common.sh"

# Validate required environment variables
require_env_vars TARGET_HOST

echo "==> Installing Valkey on ${TARGET_HOST}..."

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
set -euo pipefail

# Check if Valkey is already installed
if systemctl is-enabled valkey-server &>/dev/null; then
    echo "✓ Valkey already installed"
    exit 0
fi

# Try to install Valkey from official repository
# If not available, fall back to Redis (which is what Valkey is based on)
echo "Checking for Valkey package..."
if apt-cache show valkey-server &>/dev/null; then
    echo "Installing Valkey from official repository..."
    apt-get install -y valkey-server
    CONF_FILE="/etc/valkey/valkey.conf"
    SERVICE_NAME="valkey-server"
else
    echo "Valkey package not available, installing from Ubuntu repos as fallback..."
    apt-get install -y redis-server
    CONF_FILE="/etc/redis/redis.conf"
    SERVICE_NAME="redis-server"

    # Note: We'll still refer to it as Valkey in our documentation
    echo "Note: Installed redis-server (Valkey is a fork of Redis with same API)"
fi

# Configure to listen on localhost only
if [ -f "$CONF_FILE" ]; then
    if ! grep -q "^bind 127.0.0.1" "$CONF_FILE"; then
        sed -i 's/^bind .*/bind 127.0.0.1 ::1/' "$CONF_FILE" || echo "bind 127.0.0.1 ::1" >> "$CONF_FILE"
        echo "✓ Configured to bind to localhost"
    fi
else
    echo "⚠️  WARNING: Configuration file not found at $CONF_FILE"
fi

# Enable and start service
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
echo "✓ Service enabled and started"

# Wait for service to be ready
echo "Waiting for Valkey to be ready..."
for i in {1..30}; do
  if redis-cli ping &>/dev/null; then
    echo "✓ Valkey is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: Valkey failed to start"
    systemctl status "$SERVICE_NAME" --no-pager
    exit 1
  fi
  sleep 1
done

# Show status
echo "Valkey service status:"
systemctl status "$SERVICE_NAME" --no-pager || true

EOF

echo "==> Valkey installation complete"
