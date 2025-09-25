#!/bin/bash

# Cyber Valley Tickets - Development Environment Launcher
# This script sets up the complete development environment using tmux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SESSION_NAME="cyber-valley-dev"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're inside a tmux session
check_tmux_session() {
    if [ -n "$TMUX" ]; then
        SESSION_NAME=$(tmux display-message -p '#S')
        USE_EXISTING_SESSION=true
        log_info "Using current tmux session: $SESSION_NAME"
    else
        USE_EXISTING_SESSION=false
        # Check if our target session already exists
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            log_info "Session '$SESSION_NAME' already exists. Using it..."
            USE_EXISTING_SESSION=true
        fi
    fi
}

# Create or use tmux session
setup_tmux_session() {
    if [ "$USE_EXISTING_SESSION" = "false" ]; then
        log_info "Creating new tmux session: $SESSION_NAME"
        tmux new-session -d -s "$SESSION_NAME" -c "$SCRIPT_DIR"
        tmux rename-window -t "$SESSION_NAME:0" "setup"
    else
        if [ -n "$TMUX" ]; then
            log_info "Using current tmux session"
            # Create a new window for setup in current session
            tmux new-window -t "$SESSION_NAME" -n "setup" -c "$SCRIPT_DIR"
        else
            log_info "Attaching to existing tmux session: $SESSION_NAME"
            # Session exists but we're not in it, create a setup window
            tmux new-window -t "$SESSION_NAME" -n "setup" -c "$SCRIPT_DIR"
        fi
    fi
}

# Extract contract addresses from deploy output
extract_contract_addresses() {
    local deploy_output="$1"
    local temp_env=$(mktemp)
    
    # Copy current .env and extract new addresses
    cp .env "$temp_env"
    
    # Extract addresses using more robust patterns
    if echo "$deploy_output" | grep -q "ERC20#SimpleERC20Xylose"; then
        ERC20_ADDR=$(echo "$deploy_output" | grep "ERC20#SimpleERC20Xylose" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
        if [ -n "$ERC20_ADDR" ]; then
            sed -i "s|export PUBLIC_ERC20_ADDRESS=.*|export PUBLIC_ERC20_ADDRESS=$ERC20_ADDR|" "$temp_env"
            log_success "Extracted ERC20 address: $ERC20_ADDR"
        fi
    fi
    
    if echo "$deploy_output" | grep -q "EventTicket#CyberValleyEventTicket"; then
        TICKET_ADDR=$(echo "$deploy_output" | grep "EventTicket#CyberValleyEventTicket" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
        if [ -n "$TICKET_ADDR" ]; then
            sed -i "s|export PUBLIC_EVENT_TICKET_ADDRESS=.*|export PUBLIC_EVENT_TICKET_ADDRESS=$TICKET_ADDR|" "$temp_env"
            log_success "Extracted Event Ticket address: $TICKET_ADDR"
        fi
    fi
    
    if echo "$deploy_output" | grep -q "EventManager#CyberValleyEventManager"; then
        MANAGER_ADDR=$(echo "$deploy_output" | grep "EventManager#CyberValleyEventManager" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
        if [ -n "$MANAGER_ADDR" ]; then
            sed -i "s|export PUBLIC_EVENT_MANAGER_ADDRESS=.*|export PUBLIC_EVENT_MANAGER_ADDRESS=$MANAGER_ADDR|" "$temp_env"
            log_success "Extracted Event Manager address: $MANAGER_ADDR"
        fi
    fi
    
    # Replace .env with updated version
    mv "$temp_env" .env
    log_info "Updated .env with new contract addresses"
}

# Wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local check_command="$2"
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" >/dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            log_info "Still waiting for $service_name... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service_name failed to start within expected time"
    return 1
}

# Main setup function
run_setup() {
    cd "$SCRIPT_DIR"
    
    log_info "Starting Cyber Valley Tickets development environment setup..."
    
    # Step 1: Start Ganache
    log_info "Step 1: Starting Ganache..."
    tmux send-keys -t "$SESSION_NAME:setup" "make -C ethereum/ ganache" C-m
    
    # Wait for Ganache to be ready
    wait_for_service "Ganache" "curl -s -X POST --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_accounts\",\"params\":[],\"id\":1}' -H 'Content-Type: application/json' http://localhost:8545"
    
    # Step 2: Start backend (first time to create DB structure)
    log_info "Step 2: Starting backend (initial setup)..."
    tmux new-window -t "$SESSION_NAME" -n "backend-setup" -c "$SCRIPT_DIR"
    tmux send-keys -t "$SESSION_NAME:backend-setup" "make -C backend/ run" C-m
    
    # Wait for backend to be ready
    wait_for_service "Backend" "curl -s http://localhost:8000/api/schema/"
    
    # Step 3: Start client (first time)
    log_info "Step 3: Starting client (initial setup)..."
    tmux new-window -t "$SESSION_NAME" -n "client-setup" -c "$SCRIPT_DIR"
    tmux send-keys -t "$SESSION_NAME:client-setup" "make -C client/ dev" C-m
    
    # Wait for client to be ready
    wait_for_service "Client" "curl -s http://localhost:5173"
    
    # Step 4: Seed database
    log_info "Step 4: Seeding database..."
    tmux new-window -t "$SESSION_NAME" -n "seed-db" -c "$SCRIPT_DIR"
    tmux send-keys -t "$SESSION_NAME:seed-db" "make -C backend/ seed-db" C-m
    
    # Wait for seeding to complete
    sleep 5
    
    # Step 5: Deploy contracts and capture output
    log_info "Step 5: Deploying contracts..."
    tmux new-window -t "$SESSION_NAME" -n "deploy" -c "$SCRIPT_DIR"
    
    # Create a temporary file to capture deploy output
    DEPLOY_LOG=$(mktemp)
    
    # Send deploy command and capture output
    tmux send-keys -t "$SESSION_NAME:deploy" "make -C ethereum/ deploy-dev 2>&1 | tee $DEPLOY_LOG" C-m
    
    # Wait for deployment to complete by monitoring the log file
    log_info "Waiting for contract deployment to complete..."
    local deploy_attempts=0
    while [ $deploy_attempts -lt 60 ]; do
        if [ -f "$DEPLOY_LOG" ] && grep -q "CyberValleyEventManager" "$DEPLOY_LOG"; then
            break
        fi
        sleep 2
        deploy_attempts=$((deploy_attempts + 1))
    done
    
    if [ $deploy_attempts -eq 60 ]; then
        log_error "Contract deployment timed out"
        exit 1
    fi
    
    # Extract and update contract addresses
    if [ -f "$DEPLOY_LOG" ]; then
        log_info "Extracting contract addresses from deployment output..."
        extract_contract_addresses "$(cat "$DEPLOY_LOG")"
        rm -f "$DEPLOY_LOG"
    else
        log_error "Deploy log not found, cannot extract contract addresses"
        exit 1
    fi
    
    # Step 6: Stop the initial backend and client
    log_info "Step 6: Restarting services with new contract addresses..."
    tmux send-keys -t "$SESSION_NAME:backend-setup" C-c
    tmux send-keys -t "$SESSION_NAME:client-setup" C-c
    
    # Wait a moment for services to stop
    sleep 3
    
    # Step 7: Start indexer
    log_info "Step 7: Starting indexer..."
    tmux rename-window -t "$SESSION_NAME:deploy" "indexer"
    tmux send-keys -t "$SESSION_NAME:indexer" "make -C backend/ run-indexer" C-m
    
    # Step 8: Restart backend with new addresses
    log_info "Step 8: Starting backend with updated contract addresses..."
    tmux rename-window -t "$SESSION_NAME:backend-setup" "backend"
    tmux send-keys -t "$SESSION_NAME:backend" "make -C backend/ run" C-m
    
    # Step 9: Restart client with new addresses  
    log_info "Step 9: Starting client with updated contract addresses..."
    tmux rename-window -t "$SESSION_NAME:client-setup" "client"
    tmux send-keys -t "$SESSION_NAME:client" "make -C client/ dev" C-m
    
    # Clean up temporary windows
    tmux kill-window -t "$SESSION_NAME:setup" 2>/dev/null || true
    tmux kill-window -t "$SESSION_NAME:seed-db" 2>/dev/null || true
    
    # Final status check
    sleep 5
    log_info "Performing final health checks..."
    
    if wait_for_service "Backend (final)" "curl -s http://localhost:8000/api/schema/"; then
        if wait_for_service "Client (final)" "curl -s http://localhost:5173"; then
            log_success "All services are running successfully!"
            log_info "Services available at:"
            log_info "  🌐 Frontend: http://localhost:5173"
            log_info "  🔗 Backend API: http://localhost:8000"
            log_info "  📊 Ganache: http://localhost:8545"
            log_info "  📡 IPFS: http://localhost:8080"
            
            if [ "$USE_EXISTING_SESSION" = "false" ]; then
                log_info "Attaching to tmux session..."
                tmux attach-session -t "$SESSION_NAME"
            else
                log_info "Setup complete! Switch to tmux windows: backend, client, indexer"
            fi
        else
            log_error "Client failed to start properly"
            exit 1
        fi
    else
        log_error "Backend failed to start properly"
        exit 1
    fi
}

# Signal handlers
cleanup() {
    log_info "Cleaning up..."
    if [ "$USE_EXISTING_SESSION" = "false" ] && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log_info "Killing tmux session: $SESSION_NAME"
        tmux kill-session -t "$SESSION_NAME"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    log_info "Cyber Valley Tickets Development Environment Launcher"
    log_info "=================================================="
    
    # Check dependencies
    if ! command -v tmux &> /dev/null; then
        log_error "tmux is required but not installed. Please install tmux first."
        exit 1
    fi
    
    if ! command -v make &> /dev/null; then
        log_error "make is required but not installed. Please install make first."
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed. Please install curl first."
        exit 1
    fi
    
    # Check if .env exists
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        log_error ".env file not found. Please create .env file first."
        exit 1
    fi
    
    check_tmux_session
    setup_tmux_session
    run_setup
}

# Help function
show_help() {
    cat << EOF
Cyber Valley Tickets - Development Environment Launcher

USAGE:
    ./launch.sh [OPTIONS]

DESCRIPTION:
    This script sets up the complete Cyber Valley Tickets development environment
    using tmux. It will:
    
    1. Start Ganache blockchain
    2. Start backend and client (initial setup)
    3. Seed the database
    4. Deploy smart contracts and update .env with new addresses
    5. Start indexer
    6. Restart backend and client with updated contract addresses
    
    The script creates a tmux session with 3 windows:
    - backend: Django development server
    - client: React development server  
    - indexer: Blockchain event indexer

OPTIONS:
    -h, --help    Show this help message

REQUIREMENTS:
    - tmux
    - make  
    - curl
    - .env file in project root

EXAMPLES:
    ./launch.sh                 # Start full development environment
    ./launch.sh --help         # Show help

NOTE:
    If run inside an existing tmux session, it will use that session.
    If 'cyber-valley-dev' session already exists, it will use it.
    Otherwise, it creates a new session called 'cyber-valley-dev'.
EOF
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
