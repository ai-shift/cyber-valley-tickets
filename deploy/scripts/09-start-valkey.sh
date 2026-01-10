#!/bin/bash
set -euo pipefail

echo "==> Installing Valkey on ${TARGET_HOST}..."

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
set -euo pipefail

# Check if Valkey is already installed
if systemctl is-enabled valkey-server &>/dev/null || systemctl is-enabled redis-server &>/dev/null; then
    echo "✓ Valkey/Redis already installed"
else
    # Install Redis (Valkey repository not working, use Redis from Ubuntu repos)
    echo "Installing Redis..."
    apt-get install -y redis-server
    echo "✓ Redis installed"
fi

# Configure to listen on localhost only
if [ -f /etc/valkey/valkey.conf ]; then
    CONF_FILE="/etc/valkey/valkey.conf"
    SERVICE_NAME="valkey-server"
elif [ -f /etc/redis/redis.conf ]; then
    CONF_FILE="/etc/redis/redis.conf"
    SERVICE_NAME="redis-server"
else
    echo "ERROR: Cannot find Valkey/Redis configuration file"
    exit 1
fi

# Ensure bind to localhost
if ! grep -q "^bind 127.0.0.1" "$CONF_FILE"; then
    sed -i 's/^bind .*/bind 127.0.0.1 ::1/' "$CONF_FILE" || echo "bind 127.0.0.1 ::1" >> "$CONF_FILE"
    echo "✓ Configured to bind to localhost"
fi

# Enable and start service
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
echo "✓ Service enabled and started"

# Wait for service to be ready
echo "Waiting for Valkey/Redis to be ready..."
for i in {1..30}; do
  if redis-cli ping &>/dev/null; then
    echo "✓ Valkey/Redis is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: Valkey/Redis failed to start"
    systemctl status "$SERVICE_NAME" --no-pager
    exit 1
  fi
  sleep 1
done

# Show status
systemctl status "$SERVICE_NAME" --no-pager || true

EOF

echo "==> Valkey installation complete"
