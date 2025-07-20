-include ../.env
GANACHE_CONTAINER_NAME := "cyber-valley-tickets-ganache-node"

compile:
	pnpm exec hardhat compile
	pnpm exec hardhat typechain

tests:
	pnpm exec hardhat test --typecheck

deploy-stage:
	rm -rf ignition/deployments
	pnpm exec hardhat run scripts/deploy.js --network cvlandTest

deploy-dev:
	rm -rf ignition/deployments
	pnpm exec hardhat run scripts/deploy-dev.js --network cvlandDev

check:
	pnpm exec biome check --write test/
	pnpm exec biome check --write scripts/
	pnpm exec tsc --noEmit

# Prettier solidity plugin is piece of shit. It yells with huge stack traces without any clues about error place
format-solidity:
	pnpm exec prettier --write --plugin=prettier-plugin-solidity 'contracts/**/*.sol'

lint-solidity:
	pnpm exec solhint 'contracts/**/*.sol'

ganache:
	podman run -d \
	  --name cvland-ganache \
	  --rm \
	  -p 8545:8545 \
	  docker.io/trufflesuite/ganache:v7.9.2 \
	  --logging.verbose=true \
	  --chain.chainId=1337 \
	  --wallet.accounts=0xc631efb34d5ac643c79eb1bad6e88589fbd1e29236cd8a145fd48283ae52bb05,0X56BC75E2D63100000 \
	  --wallet.accounts=0x39e6d142076a3898e7533b9095d0ac78867d6642a9c172b4a1bf41e32980263d,0X56BC75E2D63100000 \
	  --wallet.accounts=0xf47ff34e4ac62439d984e415b48676bda8698ef2603d6bf984d0ebe1ba7d5e07,0X56BC75E2D63100000 \
	  --wallet.accounts=0xa712ac767d58175ee0856679b6fb845bf1231b051e0531fcdac63b0b9476de3d,0X56BC75E2D63100000 \

