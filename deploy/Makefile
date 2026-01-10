.PHONY: help setup setup-user install-deps deploy-backend deploy-frontend deploy-all \
        start stop restart status logs logs-backend logs-indexer logs-reaper logs-telegram \
        setup-caddy start-ipfs start-ganache start-valkey setup-tracer deploy-backend-code redeploy-backend \
        deploy-contracts

# Load environment variables
include .env
export

SCRIPTS_DIR := scripts
TEMPLATES_DIR := templates
SSH_TARGET := root@$(TARGET_HOST)

help:
	@echo "Deployment Management for Cyber Valley Tickets"
	@echo ""
	@echo "Setup commands:"
	@echo "  make setup              - Full fresh deployment"
	@echo "  make setup-user         - Create tickets user"
	@echo "  make install-deps       - Install system dependencies"
	@echo ""
	@echo "Deployment commands:"
	@echo "  make deploy-backend     - Deploy backend services"
	@echo "  make deploy-frontend    - Build and deploy frontend"
	@echo "  make deploy-all         - Deploy backend + frontend"
	@echo ""
	@echo "Service management:"
	@echo "  make start              - Start all services"
	@echo "  make stop               - Stop all services"
	@echo "  make restart            - Restart all services"
	@echo "  make status             - Show status of all services"
	@echo ""
	@echo "Logging:"
	@echo "  make logs               - Tail logs from all services"
	@echo "  make logs-backend       - Tail backend logs"
	@echo "  make logs-indexer       - Tail indexer logs"
	@echo "  make logs-reaper        - Tail reaper logs"
	@echo "  make logs-telegram      - Tail telegram bot logs"

# Full setup
setup: setup-user install-deps deploy-backend deploy-frontend start
	@echo "✓ Full deployment complete"
	@echo "Access your application at: https://$(DOMAIN_NAME)"

# User setup
setup-user:
	@echo "Creating tickets user..."
	@bash $(SCRIPTS_DIR)/01-setup-user.sh

# Install dependencies
install-deps:
	@echo "Installing system dependencies..."
	@bash $(SCRIPTS_DIR)/02-install-deps.sh
	@echo "Setting up PostgreSQL..."
	@bash $(SCRIPTS_DIR)/03-setup-postgres.sh

# Individual backend deployment steps
setup-caddy:
	@echo "Setting up Caddy..."
	@bash $(SCRIPTS_DIR)/06-setup-caddy.sh

start-ipfs:
	@echo "Starting IPFS..."
	@bash $(SCRIPTS_DIR)/07-start-ipfs.sh

start-ganache:
	@echo "Starting Ganache..."
	@bash $(SCRIPTS_DIR)/08-start-ganache.sh

start-valkey:
	@echo "Starting Valkey..."
	@bash $(SCRIPTS_DIR)/09-start-valkey.sh

setup-tracer:
	@echo "Setting up Tracer..."
	@bash $(SCRIPTS_DIR)/10-setup-tracer.sh

deploy-backend-code:
	@echo "Deploying backend code..."
	@bash $(SCRIPTS_DIR)/04-deploy-backend.sh

# Deploy backend (all backend-related components)
deploy-backend: start-ipfs start-ganache start-valkey deploy-backend-code setup-caddy setup-tracer

# Deploy frontend
deploy-frontend:
	@echo "Building and deploying frontend..."
	@bash $(SCRIPTS_DIR)/05-deploy-frontend.sh

# Deploy both
deploy-all: deploy-backend deploy-frontend

# Start all services
start:
	@echo "Starting all services..."
	@ssh $(SSH_TARGET) "systemctl start tickets-backend tickets-indexer tickets-reaper tickets-telegram"
	@echo "✓ All services started"

# Stop all services
stop:
	@echo "Stopping all services..."
	@ssh $(SSH_TARGET) "systemctl stop tickets-backend tickets-indexer tickets-reaper tickets-telegram"
	@echo "✓ All services stopped"

# Redeploy backend (stop, deploy, start)
redeploy-backend: stop deploy-backend-code start

# Deploy smart contracts
deploy-contracts:
	@echo "Deploying smart contracts..."
	@bash $(SCRIPTS_DIR)/11-deploy-contracts.sh

# Restart all services
restart: stop start

# Show status
status:
	@echo "Service Status:"
	@echo "==============="
	@ssh $(SSH_TARGET) "systemctl status tickets-backend tickets-indexer tickets-reaper tickets-telegram --no-pager" || true
	@echo ""
	@echo "Container Status:"
	@echo "================="
	@ssh $(SSH_TARGET) "podman ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" || true

# Tail all logs
logs:
	@ssh $(SSH_TARGET) "journalctl -u tickets-backend -u tickets-indexer -u tickets-reaper -u tickets-telegram -f"

# Individual service logs
logs-backend:
	@ssh $(SSH_TARGET) "journalctl -u tickets-backend -f"

logs-indexer:
	@ssh $(SSH_TARGET) "journalctl -u tickets-indexer -f"

logs-reaper:
	@ssh $(SSH_TARGET) "journalctl -u tickets-reaper -f"

logs-telegram:
	@ssh $(SSH_TARGET) "journalctl -u tickets-telegram -f"
