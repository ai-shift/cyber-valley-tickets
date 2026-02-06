.PHONY: help setup-system deploy-backend deploy-frontend deploy-all \
        status logs logs-backend logs-indexer logs-telegram \
        remote-stop remote-start remote-restart remote-rebuild-frontend \
        remote-restart-backend remote-restart-indexer

include .env
export

SCRIPTS_DIR := scripts
SSH_TARGET := root@$(TARGET_HOST)
SSH_TARGET_REMOTE := $(TARGET_USER)@$(TARGET_HOST)
REMOTE_REPO_DIR ?= /home/$(TARGET_USER)/tickets
REMOTE_SESSION_NAME ?= cyber-valley-dev

help:
	@echo "Simplified deployment for Cyber Valley Tickets"
	@echo ""
	@echo "  make setup-system   - One-time server setup (root/systemd/sudo/infra)"
	@echo "  make deploy-backend - Backend rsync + migrate + restart api/indexer/bot"
	@echo "  make deploy-frontend - Local frontend build + rsync dist"
	@echo "  make deploy-all     - Backend + frontend deploy"
	@echo "  make status         - Backend services status"
	@echo "  make logs           - Tail backend service logs"
	@echo ""
	@echo "Remote (launch.sh/tmux) workflow"
	@echo "  make remote-restart         - Full reset/reseed + production frontend build"
	@echo "  make remote-rebuild-frontend - Rebuild production frontend only"
	@echo "  make remote-restart-backend - Restart backend window in tmux session"
	@echo "  make remote-restart-indexer - Restart indexer window in tmux session"

setup-system:
	@bash $(SCRIPTS_DIR)/01-setup-system.sh

deploy-backend:
	@bash $(SCRIPTS_DIR)/04-deploy-backend.sh

deploy-frontend:
	@bash $(SCRIPTS_DIR)/05-deploy-frontend.sh

deploy-all: deploy-backend deploy-frontend

status:
	@ssh $(SSH_TARGET) "systemctl status tickets-backend tickets-indexer tickets-telegram --no-pager" || true

logs:
	@ssh $(SSH_TARGET) "journalctl -u tickets-backend -u tickets-indexer -u tickets-telegram -f"

logs-backend:
	@ssh $(SSH_TARGET) "journalctl -u tickets-backend -f"

logs-indexer:
	@ssh $(SSH_TARGET) "journalctl -u tickets-indexer -f"

logs-telegram:
	@ssh $(SSH_TARGET) "journalctl -u tickets-telegram -f"

# -----------------------------------------------------------------------------
# Remote (launch.sh) targets
#
# These are for the cyberia.my style workflow where we run `launch.sh` in a
# tmux session and serve `client/dist` via Caddy, rather than systemd services.
# -----------------------------------------------------------------------------

remote-stop:
	@ssh $(SSH_TARGET_REMOTE) "cd $(REMOTE_REPO_DIR) && ./launch.sh --stop"

remote-start:
	@ssh $(SSH_TARGET_REMOTE) "cd $(REMOTE_REPO_DIR) && ./launch.sh --production-frontend"

remote-restart:
	@ssh $(SSH_TARGET_REMOTE) "cd $(REMOTE_REPO_DIR) && ./launch.sh --stop || true && ./launch.sh --production-frontend"

remote-rebuild-frontend:
	@ssh $(SSH_TARGET_REMOTE) "cd $(REMOTE_REPO_DIR) && export PATH=\"$$HOME/.local/bin:$$HOME/.local/share/pnpm:$$PATH\" && make -C client build"

remote-restart-backend:
	@ssh $(SSH_TARGET_REMOTE) "cd $(REMOTE_REPO_DIR) && if tmux has-session -t \"$(REMOTE_SESSION_NAME)\" 2>/dev/null; then tmux send-keys -t \"$(REMOTE_SESSION_NAME):backend\" C-c; sleep 1; tmux send-keys -t \"$(REMOTE_SESSION_NAME):backend\" \"make -C backend/ run-server\" Enter; else echo \"tmux session '$(REMOTE_SESSION_NAME)' not found\"; exit 1; fi"

remote-restart-indexer:
	@ssh $(SSH_TARGET_REMOTE) "cd $(REMOTE_REPO_DIR) && if tmux has-session -t \"$(REMOTE_SESSION_NAME)\" 2>/dev/null; then tmux send-keys -t \"$(REMOTE_SESSION_NAME):indexer\" C-c; sleep 1; tmux send-keys -t \"$(REMOTE_SESSION_NAME):indexer\" \"make -C backend/ run-indexer\" Enter; else echo \"tmux session '$(REMOTE_SESSION_NAME)' not found\"; exit 1; fi"
