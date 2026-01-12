#!/bin/bash
set -euo pipefail

echo "==> Installing dependencies on ${TARGET_HOST}..."

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
set -euo pipefail

# Update package lists
apt-get update

# Install Podman and dependencies
echo "Installing Podman..."
apt-get install -y podman slirp4netns uidmap fuse-overlayfs
echo "✓ Podman installed"

# Note: Using default Podman storage configuration
# Custom storage.conf can cause issues with runroot

# Disable linger for all users
for user in $(loginctl list-users --no-legend | awk '{print $2}'); do
    loginctl disable-linger "$user" 2>/dev/null || true
done
echo "✓ Disabled linger for all users"

# Install Caddy
echo "Installing Caddy..."
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy
systemctl enable caddy
echo "✓ Caddy installed and enabled"

# Create Caddy sites directory
mkdir -p /etc/caddy/sites
if ! grep -q "import sites/\*" /etc/caddy/Caddyfile; then
    echo "import sites/*" >> /etc/caddy/Caddyfile
fi
echo "✓ Configured Caddy sites directory"

# Install uv for tickets user
echo "Installing uv package manager for tickets user..."
su - tickets -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
echo "✓ uv installed for tickets user"

# Install pnpm globally for building frontend
echo "Installing pnpm..."
curl -fsSL https://get.pnpm.io/install.sh | sh -
echo "✓ pnpm installed"

# Install valkey-cli for testing Valkey (uses redis-tools package)
apt-get install -y redis-tools
echo "✓ valkey-tools (redis-tools) installed"

echo "✓ All dependencies installed"
EOF

echo "==> Dependencies installation complete"
