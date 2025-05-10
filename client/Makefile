dev:
	pnpm exec vite --host

check:
	pnpm exec biome check --write .

compile: check
	pnpm exec tsc

pre-commit: compile

openapi-types:
	pnpm exec openapi-typescript ../backend/schema.json -o ./src/shared/api/apiTypes.d.ts
