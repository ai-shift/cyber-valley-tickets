install:
	command -v uv || bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
	cd ./backend && uv sync &
	command -v pnpm || bash -c 'curl -fsSL https://get.pnpm.io/install.sh | sh -'
	cd ./client && pnpm install &
	cd ./ethereum && pnpm install &
	wait

pre-commit:
	cd client && $(MAKE) pre-commit
	cd backend && $(MAKE) pre-commit
