#!/bin/bash
set -euo pipefail

echo "==> Setting up tickets user on ${TARGET_HOST}..."

ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'EOF'
set -euo pipefail

# Create tickets user and group
if ! id -u tickets &>/dev/null; then
    useradd -m -s /bin/bash tickets
    echo "✓ Created tickets user"
else
    echo "✓ User tickets already exists"
fi

# Copy SSH keys from root
mkdir -p /home/tickets/.ssh
cp /root/.ssh/authorized_keys /home/tickets/.ssh/authorized_keys
chown -R tickets:tickets /home/tickets/.ssh
chmod 700 /home/tickets/.ssh
chmod 600 /home/tickets/.ssh/authorized_keys
echo "✓ Copied SSH keys from root"

# Create directory structure
mkdir -p /home/tickets/{backend,client/dist,data/ipfs/{data,staging}}
chown -R tickets:tickets /home/tickets
echo "✓ Created directory structure"

# Create /etc/env directory for environment files
mkdir -p /etc/env
echo "✓ Created /etc/env directory"

# Add sudo permissions for tickets user to manage services
echo "Configuring sudo permissions for tickets user..."
cat > /etc/sudoers.d/tickets <<'SUDOERS'
# Allow tickets user to manage ticket services
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl start tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl status tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl enable tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/systemctl disable tickets-*
tickets ALL=(ALL) NOPASSWD: /usr/bin/journalctl
SUDOERS
chmod 440 /etc/sudoers.d/tickets
echo "✓ Sudo permissions configured"

echo "✓ User setup complete"
EOF

echo "==> User setup complete"
