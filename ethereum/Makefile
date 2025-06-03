GANACHE_CONTAINER_NAME := "cyber-valley-tickets-ganache-node"

compile:
	pnpm exec hardhat compile
	pnpm exec hardhat typechain

tests:
	pnpm exec hardhat test --typecheck

deploy-test:
	rm -rf ignition/deployments
	pnpm exec hardhat run scripts/deploy.js --network cvlandTest

check:
	pnpm exec biome check --write test/
	pnpm exec biome check --write lib/
	pnpm exec tsc --noEmit

# Prettier solidity plugin is piece of shit. It yells with huge stack traces without any clues about error place
format-solidity:
	pnpm exec prettier --write --plugin=prettier-plugin-solidity 'contracts/**/*.sol'

lint-solidity:
	pnpm exec solhint 'contracts/**/*.sol'
