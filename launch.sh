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

log_info "[starting] delete database"
rm -f backend/db.sqlite3
log_success "[done] delete database"

log_info "[starting] create tmux session $SESSION_NAME"
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    log_info "previous tmux session killed"
    tmux kill-session -t "$SESSION_NAME"
fi
tmux new-session -d -s "$SESSION_NAME" -c "$SCRIPT_DIR"
log_success "[done] create tmux session $SESSION_NAME"

# Create window for fast commands
tmux new-window -t "$SESSION_NAME" -n "buf" -c "$SCRIPT_DIR"

log_info "[starting] ganache"
tmux send-keys -t "$SESSION_NAME:buf" "make -C ethereum/ ganache; tmux wait -S buf_done" Enter
tmux wait "buf_done"
log_success "[started] ganache"

log_info "[starting] backend"
rm -f /tmp/backend.log
tmux new-window -t "$SESSION_NAME" -n "backend" -c "$SCRIPT_DIR"
tmux pipe-pane -t "$SESSION_NAME:backend" "cat >> /tmp/backend.log"
tmux send-keys -t "$SESSION_NAME:backend" "make -C backend/ run" Enter

log_info "[starting] frontend"
rm -f /tmp/frontend.log
tmux new-window -t "$SESSION_NAME" -n "frontend" -c "$SCRIPT_DIR"
tmux pipe-pane -t "$SESSION_NAME:frontend" "cat >> /tmp/frontend.log"
tmux send-keys -t "$SESSION_NAME:frontend" "make -C client/ dev" Enter

log_info "waiting for backend & frontend to start up"
tail -f /tmp/backend.log | grep -q 'Starting development server at'
log_success "[started] backend"
tail -f /tmp/frontend.log | grep -q 'VITE'
log_success "[started] frontend"

log_info "[starting] seed-db"
tmux send-keys -t "$SESSION_NAME:buf" "make -C backend/ seed-db; tmux wait -S buf_done" Enter
tmux wait "buf_done"
log_success "[done] seed-db"

log_info "[starting] sync-geodata"
tmux send-keys -t "$SESSION_NAME:buf" "make -C backend/ sync-geodata; tmux wait -S buf_done" Enter
tmux wait "buf_done"
log_success "[done] sync-geodata"

log_info "[starting] deploy-dev"
tmux send-keys -t "$SESSION_NAME:buf" "make -C ethereum/ deploy-dev; tmux wait -S buf_done" Enter
tmux wait "buf_done"
log_success "[done] deploy-dev"

log_info "[starting] update contracts addresses"
tmux capture-pane -pt "$SESSION_NAME:buf" | grep '^export' > /tmp/contract_vars.txt
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
log_success "[done] update contracts addresses"


log_info "[starting] indexer"
rm -f /tmp/indexer.log
tmux new-window -t "$SESSION_NAME" -n "indexer" -c "$SCRIPT_DIR"
tmux pipe-pane -t "$SESSION_NAME:indexer" "cat >> /tmp/indexer.log"
tmux send-keys -t "$SESSION_NAME:indexer" "make -C backend/ run-indexer" Enter

log_info "[restarting] backend"
tmux kill-window -t "$SESSION_NAME:backend"
rm -f /tmp/backend.log
tmux new-window -t "$SESSION_NAME" -n "backend" -c "$SCRIPT_DIR"
tmux pipe-pane -t "$SESSION_NAME:backend" "cat >> /tmp/backend.log"
tmux send-keys -t "$SESSION_NAME:backend" "make -C backend/ run" Enter

log_info "[restarting] frontend"
tmux kill-window -t "$SESSION_NAME:frontend"
rm -f /tmp/frontend.log
tmux new-window -t "$SESSION_NAME" -n "frontend" -c "$SCRIPT_DIR"
tmux pipe-pane -t "$SESSION_NAME:frontend" "cat >> /tmp/frontend.log"
tmux send-keys -t "$SESSION_NAME:frontend" "make -C client/ dev" Enter

log_info "waiting for backend & frontend to start up"
tail -f /tmp/backend.log | grep -q 'Starting development server at'
log_success "[restarted] backend"
tail -f /tmp/frontend.log | grep -q 'VITE'
log_success "[restarted] frontend"
