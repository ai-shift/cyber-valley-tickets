.PHONY: help setup-system deploy-backend deploy-frontend deploy-all \
        status logs logs-backend logs-indexer logs-telegram

include .env
export

SCRIPTS_DIR := scripts
SSH_TARGET := root@$(TARGET_HOST)

help:
	@echo "Simplified deployment for Cyber Valley Tickets"
	@echo ""
	@echo "  make setup-system   - One-time server setup (root/systemd/sudo/infra)"
	@echo "  make deploy-backend - Backend rsync + migrate + restart api/indexer/bot"
	@echo "  make deploy-frontend - Local frontend build + rsync dist"
	@echo "  make deploy-all     - Backend + frontend deploy"
	@echo "  make status         - Backend services status"
	@echo "  make logs           - Tail backend service logs"

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
