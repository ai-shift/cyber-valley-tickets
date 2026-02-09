#!/usr/bin/env bash

# Cyber Valley Tickets - Development Environment Launcher (Systemd Edition)
# This script sets up the complete development environment using systemd user services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="cyber-valley"

# Load environment variables
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
fi

# Logging functions
log_info() { printf "${BLUE}%-50s${NC} ${CYAN}[%s]${NC}\n" "$1" "$2"; }
log_success() { printf "${GREEN}%-50s${NC} ${GREEN}[%s]${NC}\n" "$1" "$2"; }
log_warning() { printf "${YELLOW}%-50s${NC} ${YELLOW}[%s]${NC}\n" "$1" "$2"; }
log_error() { printf "${RED}%-50s${NC} ${RED}[%s]${NC}\n" "$1" "$2"; }
log_section() { echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n"; }

# Wait for IPFS to be ready
wait_for_ipfs() {
    log_info "Waiting for IPFS to be ready" "waiting"
    until curl -s http://127.0.0.1:5001/api/v0/version >/dev/null 2>&1; do
        sleep 0.5
    done
    log_success "IPFS is ready" "ready"
}

# Wait for Valkey to be ready
wait_for_valkey() {
    log_info "Waiting for Valkey to be ready" "waiting"
    until echo "PING" | nc -q 1 localhost ${VALKEY_PORT:-6379} 2>/dev/null | grep -q "PONG"; do
        sleep 0.5
    done
    log_success "Valkey is ready" "ready"
}

# Stop and cleanup
stop_services() {
    log_section "Stopping Services"
    
    log_info "Stopping systemd user services" "stopping"
    systemctl --user stop cvland-backend cvland-indexer 2>/dev/null || true
    log_success "Systemd services stopped" "done"

    log_info "Stopping podman containers" "stopping"
    for name in "ganache" "ipfs" "valkey"; do
        podman ps -a | grep "cvland-$name" | awk '{print $1}' | xargs -r -I{} sh -c 'podman stop {} 2>/dev/null || true; podman rm {} 2>/dev/null || true' &
    done
    wait
    log_success "Podman containers stopped" "done"

    log_info "Cleaning up" "cleaning"
    rm -f /tmp/contract_vars.txt
    log_success "Cleanup complete" "done"
}

# Install systemd units
install_units() {
    local user_dir="$HOME/.config/systemd/user"
    mkdir -p "$user_dir"
    
    log_info "Installing systemd user units" "installing"

    for unit in cvland-backend cvland-indexer; do
        cp "$SCRIPT_DIR/deploy/systemd/units/${unit}.service" "$user_dir/"
        # Replace WorkingDirectory and EnvironmentFile with actual paths
        sed -i "s|%h/code/aishift/tickets|$SCRIPT_DIR|g" "$user_dir/${unit}.service"
        # Replace %h with home directory in PATH
        sed -i "s|%h|$HOME|g" "$user_dir/${unit}.service"
    done
    
    systemctl --user daemon-reload
    log_success "Systemd units installed" "done"
}

# Start infrastructure containers
start_containers() {
    log_section "Starting Infrastructure Containers"
    
    # Ganache
    log_info "Starting Ganache blockchain" "starting"
    podman ps -a | grep "cvland-ganache" | awk '{print $1}' | xargs -r podman rm -f 2>/dev/null || true
    
    local ganache_db_arg=""
    [[ -n "${GANACHE_DB_DIR:-}" ]] && ganache_db_arg="-v ${GANACHE_DB_DIR}:/data:Z"
    
    podman run -d \
        --name cvland-ganache \
        --rm \
        -p ${GANACHE_PORT:-8545}:8545 \
        ${ganache_db_arg} \
        docker.io/trufflesuite/ganache:v7.9.2 \
        --logging.verbose=true \
        --chain.chainId=1337 \
        ${GANACHE_DB_DIR:+--database.dbPath=/data} \
        --wallet.accounts=0xc631efb34d5ac643c79eb1bad6e88589fbd1e29236cd8a145fd48283ae52bb05,0X56BC75E2D63100000 \
        --wallet.accounts=0x39e6d142076a3898e7533b9095d0ac78867d6642a9c172b4a1bf41e32980263d,0X56BC75E2D63100000 \
        --wallet.accounts=0xf47ff34e4ac62439d984e415b48676bda8698ef2603d6bf984d0ebe1ba7d5e07,0X56BC75E2D63100000 \
        --wallet.accounts=0xa712ac767d58175ee0856679b6fb845bf1231b051e0531fcdac63b0b9476de3d,0X56BC75E2D63100000 \
        --wallet.accounts=0x96642ec34cca1c611b5b02547fe296f11b07c9dfc427f8c01cd6fb028f720dd4,0X56BC75E2D63100000 \
        --wallet.accounts=0x9a59fdc205c8635868675af4a68085aa8c5bf92baa8a9287eb3356b0e67f1b69,0X56BC75E2D63100000
    
    log_success "Ganache started" "done"
    
    # Update .env for local Ganache
    GANACHE_PORT=${GANACHE_PORT:-8545}
    sed -i "s|^export WS_ETH_NODE_HOST=.*|export WS_ETH_NODE_HOST=ws://127.0.0.1:${GANACHE_PORT}|" "$SCRIPT_DIR/.env"
    sed -i "s|^export HTTP_ETH_NODE_HOST=.*|export HTTP_ETH_NODE_HOST=http://127.0.0.1:${GANACHE_PORT}|" "$SCRIPT_DIR/.env"
    sed -i "s|^export PUBLIC_HTTP_ETH_NODE_HOST=.*|export PUBLIC_HTTP_ETH_NODE_HOST=http://127.0.0.1:${GANACHE_PORT}|" "$SCRIPT_DIR/.env"
    sed -i "s|^export PUBLIC_WS_ETH_NODE_HOST=.*|export PUBLIC_WS_ETH_NODE_HOST=ws://127.0.0.1:${GANACHE_PORT}|" "$SCRIPT_DIR/.env" 2>/dev/null || true
    
    # IPFS
    log_info "Starting IPFS" "starting"
    podman ps -a | grep "cvland-ipfs" | awk '{print $1}' | xargs -r podman rm -f 2>/dev/null || true
    
    mkdir -p "${IPFS_STAGING}" "${IPFS_DATA}"
    
    podman run -d \
        --name cvland-ipfs \
        --rm \
        --userns=keep-id \
        -v "${IPFS_STAGING}:/export" \
        -v "${IPFS_DATA}:/data/ipfs" \
        -p ${IPFS_SWARM_PORT:-4001}:4001 \
        -p ${IPFS_SWARM_PORT:-4001}:4001/udp \
        -p 127.0.0.1:${IPFS_GATEWAY_PORT:-8080}:8080 \
        -p 127.0.0.1:${IPFS_API_PORT:-5001}:5001 \
        docker.io/ipfs/go-ipfs:v0.7.0
    
    log_success "IPFS started" "done"
    
    # Valkey
    log_info "Starting Valkey" "starting"
    podman ps -a | grep "cvland-valkey" | awk '{print $1}' | xargs -r podman rm -f 2>/dev/null || true
    
    podman run -d \
        --name cvland-valkey \
        --rm \
        -p ${VALKEY_PORT:-6379}:6379 \
        docker.io/valkey/valkey:8.1.1
    
    log_success "Valkey started" "done"
    
    # Wait for readiness
    wait_for_ipfs
    wait_for_valkey
}

# Wait for backend to be ready
wait_for_backend() {
    log_info "Waiting for backend to be ready" "waiting"
    until curl -s http://127.0.0.1:${BACKEND_PORT:-8000}/api/health/ 2>/dev/null | grep -q "alive"; do
        sleep 0.5
    done
    log_success "Backend is ready" "ready"
}

# Setup database (backend must be running)
db_setup() {
    log_section "Database Setup"
    
    log_info "Cleaning database" "cleaning"
    rm -f "$SCRIPT_DIR/backend/db.sqlite3"
    log_success "Database cleaned" "done"
    
    log_info "Seeding database" "seeding"
    make -C "$SCRIPT_DIR/backend/" seed-db
    log_success "Database seeded" "done"
    
    log_info "Synchronizing geodata" "syncing"
    make -C "$SCRIPT_DIR/backend/" sync-geodata
    log_success "Geodata synchronized" "done"
}

# Deploy contracts and extract addresses (backend must be running)
deploy_contracts() {
    log_section "Smart Contract Deployment"
    
    log_info "Deploying contracts" "deploying"
    make -C "$SCRIPT_DIR/ethereum/" deploy-dev 2>&1 | tee /tmp/deploy_output.log
    log_success "Contracts deployed" "done"
    
    log_info "Extracting contract addresses" "extracting"
    grep '^export' /tmp/deploy_output.log > /tmp/contract_vars.txt || true
    
    if [[ ! -s /tmp/contract_vars.txt ]]; then
        log_error "No contract addresses found in deployment output" "failed"
        exit 1
    fi
    
    # Update .env with contract addresses
    python3 <<'PY'
import sys
from pathlib import Path

try:
    contract_vars = Path("/tmp/contract_vars.txt").read_text().splitlines()
    if not contract_vars:
        print("ERROR: No contract addresses found", file=sys.stderr)
        sys.exit(1)
    
    splitted = []
    for line in contract_vars:
        if "=" in line:
            parts = line.rstrip().split("=", 1)
            if len(parts) == 2:
                var_name, var_value = parts
                if var_value.startswith("0x") and len(var_value) >= 42:
                    splitted.append(parts)
    
    if not splitted:
        print("ERROR: Could not parse valid contract addresses", file=sys.stderr)
        sys.exit(1)
    
    env_file = Path(".env")
    if not env_file.exists():
        print("ERROR: .env file not found", file=sys.stderr)
        sys.exit(1)
    
    updated = []
    replaced = set()
    for line in env_file.read_text().splitlines():
        for replacement in splitted:
            if line.startswith(f"{replacement[0]}="):
                updated.append("=".join(replacement))
                replaced.add(replacement[0])
                break
        else:
            updated.append(line.rstrip())

    for var_name, var_value in splitted:
        if var_name not in replaced:
            updated.append(f"{var_name}={var_value}")
    
    env_file.write_text("\n".join(updated))
    print(f"Processed {len(splitted)} contract addresses")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
PY
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to update contract addresses" "failed"
        exit 1
    fi
    
    rm -f /tmp/contract_vars.txt /tmp/deploy_output.log
    log_success "Contract addresses updated" "done"
    
    # Re-source .env
    source "$SCRIPT_DIR/.env"
}

# Reset indexer state
reset_indexer() {
    log_section "Indexer Setup"
    
    log_info "Resetting indexer state" "resetting"
    cd "$SCRIPT_DIR/backend"
    .venv/bin/python manage.py shell -c "
from cyber_valley.indexer.models import LastProcessedBlock, LogProcessingError
LastProcessedBlock.objects.update_or_create(id=1, defaults={'block_number': 0})
LogProcessingError.objects.all().delete()
print('Indexer state reset')
"
    cd "$SCRIPT_DIR"
    log_success "Indexer state reset" "done"
    
    log_info "Running oneshot indexer" "indexing"
    make -C "$SCRIPT_DIR/backend/" run-indexer-oneshot || log_warning "Oneshot had warnings (may be normal)" "warning"
    log_success "Oneshot indexer completed" "done"
    
    log_info "Resetting indexer for daemon" "resetting"
    cd "$SCRIPT_DIR/backend"
    .venv/bin/python manage.py shell -c "
from cyber_valley.indexer.models import LastProcessedBlock
LastProcessedBlock.objects.update_or_create(id=1, defaults={'block_number': 0})
print('Indexer reset for daemon')
"
    cd "$SCRIPT_DIR"
    log_success "Indexer ready for daemon" "done"
}

# Start systemd services
start_systemd_services() {
    log_section "Starting Systemd Services"
    
    log_info "Starting backend" "starting"
    systemctl --user start cvland-backend
    log_success "Backend started" "done"
    
    log_info "Starting indexer" "starting"
    systemctl --user start cvland-indexer
    log_success "Indexer started" "done"
    

}

# Show status
show_status() {
    log_section "Service Status"
    
    echo -e "${BOLD}Systemd Services:${NC}"
    systemctl --user status cvland-backend cvland-indexer --no-pager 2>/dev/null || true
    
    echo -e "\n${BOLD}Podman Containers:${NC}"
    podman ps --filter name=cvland --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Start temporary backend for setup
start_temp_backend() {
    log_info "Starting temporary backend for setup" "starting"
    cd "$SCRIPT_DIR/backend"
    .venv/bin/python manage.py migrate >/dev/null 2>&1
    nohup .venv/bin/python manage.py runserver ${BACKEND_PORT:-8000} > /tmp/backend_setup.log 2>&1 &
    echo $! > /tmp/backend_setup.pid
    cd "$SCRIPT_DIR"
    wait_for_backend
    log_success "Temporary backend started" "done"
}

# Stop temporary backend
stop_temp_backend() {
    log_info "Stopping temporary backend" "stopping"
    if [[ -f /tmp/backend_setup.pid ]]; then
        kill $(cat /tmp/backend_setup.pid) 2>/dev/null || true
        rm -f /tmp/backend_setup.pid
    fi
    # Kill any remaining Django processes on our port
    pkill -f "manage.py runserver.*${BACKEND_PORT:-8000}" 2>/dev/null || true
    sleep 1
    log_success "Temporary backend stopped" "done"
}

# Main execution
main() {
    cd "$SCRIPT_DIR"
    
    # Handle stop command
    if [[ "${1:-}" == "--stop" ]]; then
        stop_services
        stop_temp_backend 2>/dev/null || true
        exit 0
    fi
    
    # Handle status command
    if [[ "${1:-}" == "--status" ]]; then
        show_status
        exit 0
    fi
    
    # Full startup
    log_section "Cyber Valley Tickets - Development Environment"
    
    install_units
    stop_services
    start_containers
    start_temp_backend
    db_setup
    deploy_contracts
    stop_temp_backend
    reset_indexer
    start_systemd_services
    
    log_section "Startup Complete"
    echo -e "${GREEN}${BOLD}All services are running!${NC}"
    echo -e "View logs: ${CYAN}./cvland logs${NC}"
    echo -e "Check status: ${CYAN}./cvland status${NC}"
    echo -e "Stop: ${CYAN}./cvland stop${NC}"
}

main "$@"
