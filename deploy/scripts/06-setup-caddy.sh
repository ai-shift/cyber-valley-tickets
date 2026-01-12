#!/bin/bash
set -euo pipefail

# Source common functions
source "$(dirname "$0")/lib/common.sh"

# Validate required environment variables
require_env_vars TARGET_HOST DOMAIN_NAME

echo "==> Setting up Caddy on ${TARGET_HOST}..."

# Process Caddyfile template with variable substitution
echo "Processing Caddyfile template..."
sed "s|{{DOMAIN_NAME}}|${DOMAIN_NAME}|g" templates/Caddyfile | \
  ssh ${SSH_TARGET:-root@$TARGET_HOST} "cat > /etc/caddy/sites/${DOMAIN_NAME}"
echo "✓ Caddyfile uploaded"

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<EOF
set -euo pipefail

# Validate Caddy configuration
echo "Validating Caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile
echo "✓ Caddy configuration valid"

# Reload Caddy
echo "Reloading Caddy..."
systemctl reload caddy
echo "✓ Caddy reloaded"
EOF

echo "==> Caddy setup complete"
echo "Your site will be available at: https://${DOMAIN_NAME}"
