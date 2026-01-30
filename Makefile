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
	./launch.sh
