GANACHE_CONTAINER_NAME := "cyber-valley-tickets-ganache-node"

compile:
	pnpm exec truffle compile

tests: compile
	pnpm exec truffle test

deploy:
	pnpm exec truffle migrate

check:
	pnpm exec biome check --write test/
