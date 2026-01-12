#!/bin/bash
set -euo pipefail

# Source common functions
source "$(dirname "$0")/lib/common.sh"

# Validate required environment variables
require_env_vars TARGET_HOST DOMAIN_NAME

echo "==> Running health checks on ${TARGET_HOST}..."

# Check 1: API endpoint
echo "Checking API endpoint..."
if curl -sf -m 10 "https://${DOMAIN_NAME}/api/" > /dev/null; then
    log_success "API is responding"
else
    log_error "API is not responding at https://${DOMAIN_NAME}/api/"
    exit 1
fi

# Check 2: Frontend
echo "Checking frontend..."
if curl -sf -m 10 "https://${DOMAIN_NAME}/" -o /dev/null; then
    log_success "Frontend is accessible"
else
    log_error "Frontend is not accessible at https://${DOMAIN_NAME}/"
    exit 1
fi

# Check 3: IPFS gateway
echo "Checking IPFS gateway..."
if curl -sf -m 10 "https://${DOMAIN_NAME}/ipfs/" -o /dev/null 2>&1 || \
   curl -sf -m 10 "https://${DOMAIN_NAME}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn" -o /dev/null 2>&1; then
    log_success "IPFS gateway is accessible"
else
    log_warn "IPFS gateway may not be responding (this may be OK if no content is pinned)"
fi

# Check 4: Ganache RPC endpoint
echo "Checking Ganache RPC endpoint..."
if curl -sf -m 10 -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   "https://${DOMAIN_NAME}/ganache" > /dev/null 2>&1; then
    log_success "Ganache RPC is responding"
else
    log_warn "Ganache RPC endpoint may not be accessible (check if path is correct)"
fi

# Check 5: Backend services on remote host
echo "Checking backend services on ${TARGET_HOST}..."
ssh ${SSH_TARGET:-root@$TARGET_HOST} bash <<'REMOTE_CHECK'
set -euo pipefail

FAILED=0

# Check systemd services
for service in tickets-backend tickets-indexer tickets-reaper tickets-telegram; do
    if systemctl is-active --quiet $service; then
        echo "✓ $service is running"
    else
        echo "❌ ERROR: $service is not running"
        FAILED=1
    fi
done

# Check Podman containers
for container in cvland-ipfs ganache-node; do
    if podman ps --filter "name=$container" --format "{{.Names}}" | grep -q "^$container$"; then
        echo "✓ Container $container is running"
    else
        echo "❌ ERROR: Container $container is not running"
        FAILED=1
    fi
done

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo "✓ PostgreSQL is running"
else
    echo "❌ ERROR: PostgreSQL is not running"
    FAILED=1
fi

# Check Valkey
if systemctl is-active --quiet valkey-server || systemctl is-active --quiet redis-server; then
    echo "✓ Valkey is running"
else
    echo "❌ ERROR: Valkey is not running"
    FAILED=1
fi

exit $FAILED
REMOTE_CHECK

if [ $? -eq 0 ]; then
    log_success "All backend services are healthy"
else
    log_error "Some backend services are not healthy"
    exit 1
fi

echo ""
echo "================================"
log_success "All health checks passed!"
echo "================================"
echo ""
echo "Application is accessible at: https://${DOMAIN_NAME}"
echo "API endpoint: https://${DOMAIN_NAME}/api/"
