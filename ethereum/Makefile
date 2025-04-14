GANACHE_CONTAINER_NAME := "cyber-valley-tickets-ganache-node"

compile: format-contracts
	pnpm exec hardhat compile

tests:
	pnpm exec hardhat test --typecheck

deploy:
	pnpm exec truffle migrate

check:
	pnpm exec biome check --write test/

format-contracts:
	pnpm exec prettier --write --plugin=prettier-plugin-solidity 'contracts/**/*.sol'
