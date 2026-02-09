-include ../.env.example
-include ../.env

FRONTEND_MODE ?= static

dev:
	pnpm exec vite --host

preview:
	pnpm exec vite preview

build:
	pnpm build

run:
ifeq ($(FRONTEND_MODE),dev)
	$(MAKE) dev
else ifeq ($(FRONTEND_MODE),static)
	$(MAKE) build
	pnpm exec vite preview --host --port $${VITE_PORT:-5173} --strictPort
else ifeq ($(FRONTEND_MODE),preview)
	$(MAKE) build
	pnpm exec vite preview --host --port $${VITE_PORT:-5173} --strictPort
else
	@echo "Unknown FRONTEND_MODE=$(FRONTEND_MODE). Use dev|static|preview." && exit 1
endif

check:
	pnpm exec biome check --write .

compile: check
	pnpm exec tsc

pre-commit: compile

openapi-types:
	pnpm exec openapi-typescript ../backend/schema.json -o ./src/shared/api/apiTypes.d.ts
