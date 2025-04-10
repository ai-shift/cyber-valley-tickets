GANACHE_CONTAINER_NAME := "cyber-valley-tickets-ganache-node"

compile:
	pnpm exec truffle compile

deploy: run-ganache
	pnpm exec truffle migrate

check:
	pnpm exec biome check --write test/

run-ganache:
	@if docker ps --filter "name=$(GANACHE_CONTAINER_NAME)" | grep -q $(GANACHE_CONTAINER_NAME); then \
		echo "Ganache container already running."; \
	else \
		docker run --name $(GANACHE_CONTAINER_NAME) --detach --publish 8545:8545 trufflesuite/ganache:latest; \
		echo "Ganache container started."; \
	fi

stop-ganache:
	docker stop $(GANACHE_CONTAINER_NAME)

remove-ganache:
	docker rm $(GANACHE_CONTAINER_NAME)

restart-ganache: stop-ganache remove-ganache run-ganache
