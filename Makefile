install:
	which uv 2>1 >/dev/null || bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
	cd ./backend && uv sync
	which pnpm 2>1 >/dev/null || bash -c 'curl -fsSL https://get.pnpm.io/install.sh | sh -'
	cd ./client && pnpm install

pre-commit:
	cd client && $(MAKE) pre-commit
	cd backend && $(MAKE) pre-commit
