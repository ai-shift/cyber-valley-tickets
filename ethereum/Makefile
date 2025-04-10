GANACHE_CONTAINER_NAME := "cyber-valley-tickets-ganache-node"

compile:
	pnpm exec hardhat compile

tests:
	pnpm exec hardhat test --vv

deploy:
	pnpm exec truffle migrate

check:
	pnpm exec biome check --write test/
