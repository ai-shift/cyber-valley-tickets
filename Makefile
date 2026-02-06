 -include .env.example
 -include .env

install:
	@command -v uv >/dev/null 2>&1 || { \
		echo "Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh; \
		export PATH="$$HOME/.local/bin:$$PATH"; \
	}
	@command -v pnpm >/dev/null 2>&1 || { \
		echo "Installing pnpm..."; \
		curl -fsSL https://get.pnpm.io/install.sh | sh -; \
		export PATH="$$HOME/.local/share/pnpm:$$PATH"; \
	}
	@echo "Installing dependencies..."
	@export PATH="$$HOME/.local/bin:$$HOME/.local/share/pnpm:$$PATH"; \
	cd ./backend && uv sync & \
	cd ./client && pnpm install & \
	cd ./ethereum && pnpm install & \
	wait
	@echo "Installation complete! If this was a fresh install, run: source ~/.bashrc (or your shell config)"

pre-commit:
	cd client && $(MAKE) pre-commit
	cd backend && $(MAKE) pre-commit

dev:
	./launch.sh --stop
	./launch.sh $(ARGS)

# -----------------------------------------------------------------------------
# Production-Like Ops (Remote Host Workflow)
#
# These targets are intended to be run ON the server (e.g. cyberia.my) from the
# repo worktree. They assume `launch.sh` manages a tmux session named
# "cyber-valley-dev" and uses windows: backend, indexer, buf.
# -----------------------------------------------------------------------------

SESSION_NAME ?= cyber-valley-dev

prod-stop:
	./launch.sh --stop

prod-start:
	./launch.sh --production-frontend

prod-restart:
	./launch.sh --stop
	./launch.sh --production-frontend

prod-rebuild-frontend:
	@export PATH="$$HOME/.local/bin:$$HOME/.local/share/pnpm:$$PATH"; \
	$(MAKE) -C client build

prod-restart-backend:
	@if tmux has-session -t "$(SESSION_NAME)" 2>/dev/null; then \
		tmux send-keys -t "$(SESSION_NAME):backend" C-c; \
		sleep 1; \
		tmux send-keys -t "$(SESSION_NAME):backend" "make -C backend/ run-server" Enter; \
	else \
		echo "tmux session '$(SESSION_NAME)' not found; running prod-restart"; \
		$(MAKE) prod-restart; \
	fi

prod-restart-indexer:
	@if tmux has-session -t "$(SESSION_NAME)" 2>/dev/null; then \
		tmux send-keys -t "$(SESSION_NAME):indexer" C-c; \
		sleep 1; \
		tmux send-keys -t "$(SESSION_NAME):indexer" "make -C backend/ run-indexer" Enter; \
	else \
		echo "tmux session '$(SESSION_NAME)' not found; running prod-restart"; \
		$(MAKE) prod-restart; \
	fi

prod-soft-update-backend:
	@export PATH="$$HOME/.local/bin:$$HOME/.local/share/pnpm:$$PATH"; \
	cd backend && uv sync
	@$(MAKE) prod-restart-backend

prod-soft-update-frontend:
	@export PATH="$$HOME/.local/bin:$$HOME/.local/share/pnpm:$$PATH"; \
	cd client && pnpm install
	@$(MAKE) prod-rebuild-frontend
