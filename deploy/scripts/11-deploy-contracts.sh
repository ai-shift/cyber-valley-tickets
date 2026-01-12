#!/bin/bash
set -euo pipefail

# Source common functions
source "$(dirname "$0")/lib/common.sh"

# Validate required environment variables
require_env_vars TARGET_HOST DOMAIN_NAME

echo "==> Deploying smart contracts to Ganache on ${TARGET_HOST}..."

# Set up environment variables for deployment
export PUBLIC_API_HOST="https://${DOMAIN_NAME}"
export IPFS_PUBLIC_HOST="https://${DOMAIN_NAME}"

# Seed database with users and auth tokens
echo "Seeding database with users and tokens..."
ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'REMOTE'
su - tickets <<'INNER_SCRIPT'
cd /home/tickets/backend
set -a
source /etc/env/tickets.env
set +a
/home/tickets/.local/bin/uv run python manage.py seed_db --flush
INNER_SCRIPT
REMOTE
echo "✓ Database seeded"

# Compile contracts
echo "Compiling contracts..."
cd ../ethereum
pnpm exec hardhat compile

# Backup and clear previous deployments
if [ -d ignition/deployments ]; then
    BACKUP_DIR="ignition/deployments.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backing up previous deployments to $BACKUP_DIR..."
    mv ignition/deployments "$BACKUP_DIR"
    echo "✓ Backup created"
else
    echo "No previous deployments to backup"
fi

# Deploy contracts
echo "Deploying contracts to Ganache..."
CONTRACT_OUTPUT=$(pnpm exec hardhat run scripts/deploy-dev.js --network cyberia 2>&1)
echo "$CONTRACT_OUTPUT"

# Extract contract addresses
ERC20_ADDRESS=$(echo "$CONTRACT_OUTPUT" | grep "export PUBLIC_ERC20_ADDRESS" | cut -d'=' -f2)
TICKET_ADDRESS=$(echo "$CONTRACT_OUTPUT" | grep "export PUBLIC_EVENT_TICKET_ADDRESS" | cut -d'=' -f2)
MANAGER_ADDRESS=$(echo "$CONTRACT_OUTPUT" | grep "export PUBLIC_EVENT_MANAGER_ADDRESS" | cut -d'=' -f2)

# Validate extracted addresses
if [ -z "$ERC20_ADDRESS" ] || [ -z "$TICKET_ADDRESS" ] || [ -z "$MANAGER_ADDRESS" ]; then
    log_error "Failed to extract contract addresses from deployment output"
    exit 1
fi

# Validate address formats
if ! validate_eth_address "$ERC20_ADDRESS" "ERC20"; then
    exit 1
fi
if ! validate_eth_address "$TICKET_ADDRESS" "Event Ticket"; then
    exit 1
fi
if ! validate_eth_address "$MANAGER_ADDRESS" "Event Manager"; then
    exit 1
fi

echo "✓ Contracts deployed:"
echo "  ERC20: $ERC20_ADDRESS"
echo "  Event Ticket: $TICKET_ADDRESS"
echo "  Event Manager: $MANAGER_ADDRESS"

# Update .env file with new addresses
cd ../deploy
sed -i "s|PUBLIC_EVENT_MANAGER_ADDRESS=.*|PUBLIC_EVENT_MANAGER_ADDRESS=$MANAGER_ADDRESS|" .env
sed -i "s|PUBLIC_EVENT_TICKET_ADDRESS=.*|PUBLIC_EVENT_TICKET_ADDRESS=$TICKET_ADDRESS|" .env
sed -i "s|PUBLIC_ERC20_ADDRESS=.*|PUBLIC_ERC20_ADDRESS=$ERC20_ADDRESS|" .env

echo "✓ Updated .env with new contract addresses"
echo "==> Smart contracts deployed successfully"
