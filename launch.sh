#!/usr/bin/env bash

# Cyber Valley Tickets - Development Environment Launcher
# This script sets up the complete development environment using tmux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
SESSION_NAME="cyber-valley-dev"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRODUCTION_FRONTEND=false

# Parse command line arguments
STOP_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --production-frontend)
            PRODUCTION_FRONTEND=true
            shift
            ;;
        --stop)
            STOP_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--production-frontend] [--stop]"
            exit 1
            ;;
    esac
done

# Logging functions with aligned columns
log_info() {
    printf "${BLUE}%-50s${NC} ${CYAN}[%s]${NC}\n" "$1" "$2"
}

log_success() {
    printf "${GREEN}%-50s${NC} ${GREEN}[%s]${NC}\n" "$1" "$2"
}

log_warning() {
    printf "${YELLOW}%-50s${NC} ${YELLOW}[%s]${NC}\n" "$1" "$2"
}

log_error() {
    printf "${RED}%-50s${NC} ${RED}[%s]${NC}\n" "$1" "$2"
}

log_section() {
    echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n"
}

# Check if tmux is available, install if possible
check_and_install_tmux() {
    if command -v tmux &> /dev/null; then
        return 0
    fi

    log_warning "tmux not found" "checking"

    # Detect package manager and attempt installation
    if command -v apt &> /dev/null; then
        log_info "Installing tmux via apt" "installing"
        sudo apt update && sudo apt install -y tmux
    elif command -v xbps-install &> /dev/null; then
        log_info "Installing tmux via xbps-install" "installing"
        sudo xbps-install -y tmux
    elif command -v brew &> /dev/null; then
        log_info "Installing tmux via brew" "installing"
        brew install tmux
    else
        log_error "Could not install tmux automatically" "failed"
        echo "Please install tmux manually using your package manager:"
        echo "  - Debian/Ubuntu: sudo apt install tmux"
        echo "  - Void Linux:    sudo xbps-install tmux"
        echo "  - macOS:         brew install tmux"
        exit 1
    fi

    if command -v tmux &> /dev/null; then
        log_success "tmux installed successfully" "done"
    else
        log_error "tmux installation failed" "failed"
        exit 1
    fi
}

# Validate required directories exist
validate_environment() {
    local missing_dirs=()
    for dir in backend client ethereum; do
        if [[ ! -d "$SCRIPT_DIR/$dir" ]]; then
            missing_dirs+=("$dir")
        fi
    done

    if [[ ${#missing_dirs[@]} -gt 0 ]]; then
        log_error "Missing required directories: ${missing_dirs[*]}" "failed"
        exit 1
    fi
}

# Helper: Create tmux window with logging
create_tmux_window() {
    local window_name="$1"
    local log_file="$2"

    tmux new-window -t "$SESSION_NAME" -n "$window_name" -c "$SCRIPT_DIR"
    if [[ -n "$log_file" ]]; then
        rm -f "$log_file"
        tmux pipe-pane -t "$SESSION_NAME:$window_name" "cat >> $log_file"
    fi
}

# Helper: Run command in buf window and wait for completion with exit code check
run_buf_command() {
  local cmd=$1
  local done=/tmp/done.$$
  local exit_code_file=/tmp/exit_code.$$
  rm -f "$done" "$exit_code_file"
  tmux send-keys -t "$SESSION_NAME:buf" \
       "$cmd; echo \$? > '$exit_code_file'; touch '$done'" C-m
  until [[ -f $done ]]; do sleep 0.1; done
  local exit_code=$(cat "$exit_code_file" 2>/dev/null || echo "1")
  rm -f "$done" "$exit_code_file"
  if [[ "$exit_code" -ne 0 ]]; then
    return 1
  fi
  return 0
}

# Helper: Wait for service to start by monitoring log
wait_for_service() {
    local log_file="$1"
    local pattern="$2"
    local service_name="$3"

    # First check if pattern already exists in log (service started quickly)
    if grep -q "$pattern" "$log_file" 2>/dev/null; then
        return 0
    fi

    # Otherwise wait for new lines
    if timeout 60 tail -f "$log_file" | grep -q "$pattern"; then
        return 0
    else
        log_error "$service_name failed to start" "timeout"
        exit 1
    fi
}

# Helper: Restart a service (kill window and recreate)
restart_service() {
    local service_name="$1"
    local window_name="$2"
    local log_file="$3"
    local make_command="$4"

    log_info "Restarting $service_name" "restarting"
    tmux kill-window -t "$SESSION_NAME:$window_name"
    create_tmux_window "$window_name" "$log_file"
    tmux send-keys -t "$SESSION_NAME:$window_name" "$make_command" Enter
}

# Helper: Stop all services and cleanup
stop_services() {
    log_section "Stopping Services"

    log_info "Stopping tmux session" "stopping"
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        tmux kill-session -t "$SESSION_NAME"
        log_success "Tmux session stopped" "done"
    else
        log_warning "No tmux session found" "skipped"
    fi

    log_info "Stopping podman containers" "stopping"
    for name in "ganache" "ipfs" "valkey"; do
        podman ps -a \
            | grep "cvland-$name" \
            | awk '{print $1}' \
            | xargs -r -I{} sh -c 'podman stop {} || true; podman rm {} || true' 2>/dev/null &
    done
    wait
    log_success "Podman containers stopped" "done"

    log_info "Cleaning up temporary files" "cleaning"
    rm -f /tmp/done.* /tmp/exit_code.* /tmp/contract_vars.txt
    rm -f /tmp/backend.log /tmp/frontend.log /tmp/indexer.log /tmp/telegram-bot.log
    log_success "Temporary files cleaned" "done"

    log_section "Stop Complete"
    echo -e "${GREEN}${BOLD}All services stopped!${NC}"
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

# Handle stop mode
if [[ "$STOP_MODE" == true ]]; then
    stop_services
    exit 0
fi

# Check prerequisites
check_and_install_tmux
validate_environment

# ============================================================================
log_section "Environment Setup"

log_info "Cleaning database" "starting"
rm -f backend/db.sqlite3
log_success "Database cleaned" "done"

log_info "Stopping containers" "starting"
for name in "ganache" "ipfs" "valkey"; do
    podman ps -a \
	| grep "cvland-$name" \
	| awk '{print $1}' \
	| xargs -r -I{} sh -c 'podman stop {} || true; podman rm {} || true' 2>/dev/null &
done
wait
log_success "Containers stopped" "done"

log_info "Installing dependencies" "starting"
make install 2>&1 >/dev/null
log_success "Dependencies installed" "done"

log_info "Creating tmux session: $SESSION_NAME" "starting"
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    log_info "Killing previous tmux session" "cleaning"
    tmux kill-session -t "$SESSION_NAME"
fi
tmux new-session -d -s "$SESSION_NAME" -c "$SCRIPT_DIR"
log_success "Tmux session created" "done"

# Create window for running sequential commands
tmux new-window -t "$SESSION_NAME" -n "buf" -c "$SCRIPT_DIR"

# ============================================================================
log_section "Starting Services"

log_info "Starting Ganache blockchain" "starting"
if ! run_buf_command "make -C ethereum/ ganache"; then
    log_error "Ganache blockchain failed to start" "failed"
    exit 1
fi
log_success "Ganache blockchain ready" "started"

# Update .env to use local Ganache for this session
log_info "Updating blockchain connection to local Ganache" "updating"
# Set environment variables for current session
export WS_ETH_NODE_HOST=ws://127.0.0.1:8545
export PUBLIC_WS_ETH_NODE_HOST=ws://127.0.0.1:8545
# Update .env file for child processes
sed -i 's|^export WS_ETH_NODE_HOST=.*|export WS_ETH_NODE_HOST=ws://127.0.0.1:8545|' .env
sed -i 's|^export PUBLIC_WS_ETH_NODE_HOST=.*|export PUBLIC_WS_ETH_NODE_HOST=ws://127.0.0.1:8545|' .env 2>/dev/null || echo 'export PUBLIC_WS_ETH_NODE_HOST=ws://127.0.0.1:8545' >> .env
# Also update HTTP endpoint for local Ganache
sed -i 's|^export PUBLIC_HTTP_ETH_NODE_HOST=.*|export PUBLIC_HTTP_ETH_NODE_HOST=http://127.0.0.1:8545|' .env
# For backwards compatibility
sed -i 's|^export HTTP_ETH_NODE_HOST=.*|export HTTP_ETH_NODE_HOST=http://127.0.0.1:8545|' .env 2>/dev/null || true
log_success "Blockchain connection updated to local Ganache" "done"

log_info "Starting Django backend server" "starting"
create_tmux_window "backend" "/tmp/backend.log"
tmux send-keys -t "$SESSION_NAME:backend" "make -C backend/ run" Enter

if [[ "$PRODUCTION_FRONTEND" == false ]]; then
    log_info "Starting Vite frontend server" "starting"
    create_tmux_window "frontend" "/tmp/frontend.log"
    tmux send-keys -t "$SESSION_NAME:frontend" "make -C client/ dev" Enter
fi

log_info "Waiting for services to initialize" "waiting"
wait_for_service "/tmp/backend.log" "Starting development server at" "Backend"
log_success "Django backend server ready" "started"
if [[ "$PRODUCTION_FRONTEND" == false ]]; then
    wait_for_service "/tmp/frontend.log" "VITE" "Frontend"
    log_success "Vite frontend server ready" "started"
fi

# ============================================================================
log_section "Database Configuration"

log_info "Seeding database with initial data" "starting"
if ! run_buf_command "make -C backend/ seed-db"; then
    log_error "Database seeding failed" "failed"
    exit 1
fi
log_success "Database seeding completed" "done"

log_info "Synchronizing geodata" "starting"
if ! run_buf_command "make -C backend/ sync-geodata"; then
    log_error "Geodata synchronization failed" "failed"
    exit 1
fi
log_success "Geodata synchronization completed" "done"

# ============================================================================
log_section "Smart Contract Deployment"

log_info "Deploying contracts to local network" "starting"
if ! run_buf_command "make -C ethereum/ deploy-dev"; then
    log_error "Contract deployment failed" "failed"
    echo -e "${RED}Check the buf window for error details:${NC}"
    echo -e "  ${CYAN}tmux attach -t $SESSION_NAME:buf${NC}"
    exit 1
fi
log_success "Contracts deployed successfully" "done"

log_info "Updating contract addresses in .env" "starting"
# Extract contract addresses from deployment output
# Capture pane output and join wrapped lines (-J flag)
# Lines may be wrapped due to terminal width, so we need to join them
tmux capture-pane -J -pt "$SESSION_NAME:buf" | grep '^export' > /tmp/contract_vars.txt

# Verify contract addresses were captured
if [[ ! -s /tmp/contract_vars.txt ]]; then
    log_error "No contract addresses found in deployment output" "failed"
    echo -e "${RED}Check the buf window for deployment errors:${NC}"
    echo -e "  ${CYAN}tmux attach -t $SESSION_NAME:buf${NC}"
    exit 1
fi

# Update .env file with new contract addresses
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
                # Validate that this looks like an Ethereum address
                if var_value.startswith("0x") and len(var_value) >= 42:
                    splitted.append(parts)
                else:
                    print(f"WARNING: Skipping invalid address: {var_name}={var_value}", file=sys.stderr)
    
    if not splitted:
        print("ERROR: Could not parse valid contract addresses", file=sys.stderr)
        sys.exit(1)
    
    env_file = Path(".env")
    if not env_file.exists():
        print("ERROR: .env file not found", file=sys.stderr)
        sys.exit(1)
    
    updated = []
    for line in env_file.read_text().splitlines():
        for replacement in splitted:
            if line.startswith(f"{replacement[0]}="):
                updated.append("=".join(replacement))
                break
        else:
            updated.append(line.rstrip())
    
    env_file.write_text("\n".join(updated))
    print(f"Updated {len(splitted)} contract addresses")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
PY

if [[ $? -ne 0 ]]; then
    log_error "Failed to update contract addresses in .env" "failed"
    exit 1
fi

rm -f /tmp/contract_vars.txt
log_success "Contract addresses updated" "done"

# ============================================================================
log_section "Starting Indexer & Restarting Services"

log_info "Waiting for IPFS to be ready" "waiting"
until curl -s http://127.0.0.1:5001/api/v0/version >/dev/null 2>&1; do
    sleep 1
done
log_success "IPFS is ready" "ready"

log_info "Starting blockchain indexer" "starting"
create_tmux_window "indexer" "/tmp/indexer.log"
tmux send-keys -t "$SESSION_NAME:indexer" "make -C backend/ run-indexer" Enter
sleep 2
if ! tmux list-windows -t "$SESSION_NAME" | grep -q "indexer"; then
    log_error "Failed to create indexer window" "failed"
    exit 1
fi
log_success "Blockchain indexer started" "started"

log_info "Starting telegram bot" "starting"
create_tmux_window "telegram-bot" "/tmp/telegram-bot.log"
tmux send-keys -t "$SESSION_NAME:telegram-bot" "make -C backend/ run-telegram-bot" Enter
sleep 2
if ! tmux list-windows -t "$SESSION_NAME" | grep -q "telegram-bot"; then
    log_error "Failed to create telegram-bot window" "failed"
    exit 1
fi
log_success "Telegram bot started" "started"

restart_service "Backend" "backend" "/tmp/backend.log" "make -C backend/ run"

if [[ "$PRODUCTION_FRONTEND" == true ]]; then
    log_info "Starting frontend build" "starting"
    if ! run_buf_command "make -C client/ build"; then
        log_error "Frontend build failed" "failed"
        exit 1
    fi
    log_success "Frontend build" "done"
else
    restart_service "Frontend" "frontend" "/tmp/frontend.log" "make -C client/ dev"
fi

# Give indexer time to process historical events
log_info "Waiting for indexer to process events" "waiting"

# Wait for events to be indexed before minting tickets
log_info "Waiting for events to be indexed" "waiting"
for i in {1..60}; do
    events_count=$(curl -s http://127.0.0.1:${BACKEND_PORT}/api/events/ 2>/dev/null | grep -o '"id":' | wc -l)
    if [ "$events_count" -ge 3 ]; then
        log_success "Events indexed successfully" "done"
        break
    fi
    if [ "$i" -eq 60 ]; then
        log_warning "Timeout waiting for events, but continuing..." "timeout"
    fi
    sleep 2
done

# Mint tickets after events are indexed
log_info "Minting tickets" "starting"
if ! run_buf_command "make -C ethereum/ mint-tickets"; then
    log_error "Ticket minting failed" "failed"
    echo -e "${RED}Check the buf window for error details:${NC}"
    echo -e "  ${CYAN}tmux attach -t $SESSION_NAME:buf${NC}"
    exit 1
fi
log_success "Tickets minted successfully" "done"

log_info "Waiting for services to restart" "waiting"
wait_for_service "/tmp/backend.log" "Starting development server at" "Backend"
log_success "Django backend server ready" "restarted"
if [[ "$PRODUCTION_FRONTEND" == false ]]; then
    wait_for_service "/tmp/frontend.log" "VITE" "Frontend"
    log_success "Vite frontend server ready" "restarted"
fi

# ============================================================================
log_section "Startup Complete"
echo -e "${GREEN}${BOLD}All services are running!${NC}"
echo -e "Attach to session: ${CYAN}tmux attach -t $SESSION_NAME${NC}"
