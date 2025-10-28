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
while [[ $# -gt 0 ]]; do
    case $1 in
        --production-frontend)
            PRODUCTION_FRONTEND=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--production-frontend]"
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

# Helper: Run command in buf window and wait
run_buf_command() {
  local cmd=$1
  local done=/tmp/done.$$
  tmux send-keys -t "$SESSION_NAME:buf" \
       "$cmd; touch '$done'" C-m
  until [[ -f $done ]]; do sleep 0.1; done
  rm -f "$done"
}

# Helper: Wait for service to start by monitoring log
wait_for_service() {
    local log_file="$1"
    local pattern="$2"
    local service_name="$3"

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

# ============================================================================
# MAIN SCRIPT
# ============================================================================

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
run_buf_command "make -C ethereum/ ganache"
log_success "Ganache blockchain ready" "started"

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
run_buf_command "make -C backend/ seed-db"
log_success "Database seeding completed" "done"

log_info "Synchronizing geodata" "starting"
run_buf_command "make -C backend/ sync-geodata"
log_success "Geodata synchronization completed" "done"

# ============================================================================
log_section "Smart Contract Deployment"

log_info "Deploying contracts to local network" "starting"
run_buf_command "make -C ethereum/ deploy-dev"
log_success "Contracts deployed successfully" "done"

log_info "Updating contract addresses in .env" "starting"
# Extract contract addresses from deployment output
tmux capture-pane -pt "$SESSION_NAME:buf" | grep '^export' > /tmp/contract_vars.txt
# Update .env file with new contract addresses
python3 <<'PY'
from pathlib import Path
splitted=[
    line.rstrip().split("=")
    for line
    in Path("/tmp/contract_vars.txt").read_text().splitlines()
]
env_file = Path(".env")
updated = []
for line in env_file.read_text().splitlines():
    for replacement in splitted:
        if not line.startswith(f"{replacement[0]}="):
            continue
        updated.append("=".join(replacement))
        break
    else:
        updated.append(line.rstrip())
env_file.write_text("\n".join(updated))
PY
rm -f /tmp/contract_vars.txt
log_success "Contract addresses updated" "done"

# ============================================================================
log_section "Starting Indexer & Restarting Services"

log_info "Starting blockchain indexer" "starting"
create_tmux_window "indexer" "/tmp/indexer.log"
tmux send-keys -t "$SESSION_NAME:indexer" "make -C backend/ run-indexer" Enter
log_success "Blockchain indexer started" "started"

log_info "Starting telegram bot" "starting"
create_tmux_window "telegram-bot" "/tmp/telegram-bot.log"
tmux send-keys -t "$SESSION_NAME:telegram-bot" "make -C backend/ run-telegram-bot" Enter
log_success "Telegram bot started" "started"

restart_service "Backend" "backend" "/tmp/backend.log" "make -C backend/ run"

if [[ "$PRODUCTION_FRONTEND" == true ]]; then
    log_info "Starting frontend build" "starting"
    run_buf_command "make -C client/ build"
    log_success "Frontend build" "done"
else
    restart_service "Frontend" "frontend" "/tmp/frontend.log" "make -C client/ dev"
fi

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
