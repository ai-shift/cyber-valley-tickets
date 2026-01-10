#!/bin/bash
set -euo pipefail

echo "==> Setting up Caddy on ${TARGET_HOST}..."

# Copy Caddyfile template
scp templates/Caddyfile ${SSH_TARGET:-root@$TARGET_HOST}:/etc/caddy/sites/${DOMAIN_NAME}

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
