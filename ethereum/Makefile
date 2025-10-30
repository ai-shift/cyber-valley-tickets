-include ../.env.example
-include ../.env

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

grant-backend-role:
	pnpm exec hardhat run scripts/grant-backend-role.js --network cvlandDev

check:
	pnpm exec biome check --write test/
	pnpm exec biome check --write scripts/

# Prettier solidity plugin is piece of shit. It yells with huge stack traces without any clues about error place
format-solidity:
	pnpm exec prettier --write --plugin=prettier-plugin-solidity 'contracts/**/*.sol'

lint-solidity:
	pnpm exec solhint 'contracts/**/*.sol'

ganache:
	@echo "Master    	 (0) 0x2789023F36933E208675889869c7d3914A422921 (100 ETH)"
	@echo "Creator   	 (1) 0x96e37a0cD915c38dE8B5aAC0db61eB7eB839CeeB (100 ETH)"
	@echo "Customer1 	 (2) 0xA84036A18ecd8f4F3D21ca7f85BEcC033571b15e (100 ETH)"
	@echo "VerifiedShaman 	 (3) 0x7617b92b06c4ce513c53Df1c818ed25f95475f69 (100 ETH)"
	@echo "LocalProvider 	 (4) 0x9772d9a6A104c162b97767e6a654Be54370A042F (100 ETH)"
	@echo "Backend	         (5) 0xEd7f6CA6e91AaA3Ff2C3918B5cAF02FF449Ab3A4 (100ETH)"
	podman run -d \
	  --name cvland-ganache \
	  --rm \
	  -p $$GANACHE_PORT:8545 \
	  docker.io/trufflesuite/ganache:v7.9.2 \
	  --logging.verbose=true \
	  --chain.chainId=1337 \
	  --wallet.accounts=0xc631efb34d5ac643c79eb1bad6e88589fbd1e29236cd8a145fd48283ae52bb05,0X56BC75E2D63100000 \
	  --wallet.accounts=0x39e6d142076a3898e7533b9095d0ac78867d6642a9c172b4a1bf41e32980263d,0X56BC75E2D63100000 \
	  --wallet.accounts=0xf47ff34e4ac62439d984e415b48676bda8698ef2603d6bf984d0ebe1ba7d5e07,0X56BC75E2D63100000 \
	  --wallet.accounts=0xa712ac767d58175ee0856679b6fb845bf1231b051e0531fcdac63b0b9476de3d,0X56BC75E2D63100000 \
	  --wallet.accounts=0x96642ec34cca1c611b5b02547fe296f11b07c9dfc427f8c01cd6fb028f720dd4,0X56BC75E2D63100000 \
	  --wallet.accounts=0x9a59fdc205c8635868675af4a68085aa8c5bf92baa8a9287eb3356b0e67f1b69,0X56BC75E2D63100000 \
