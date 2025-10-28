-include ../.env.example
-include ../.env
ipfs_container_name := "cvland-ipfs"
valkey_container_name := "cvland-valkey"
python := .venv/bin/python

format:
	uv run ruff format

lint: format
	uv run ruff check --fix
	uv run mypy .

pre-commit: lint

run: run-ipfs-node run-valkey run-server

make-migrations:
	$(python) manage.py makemigrations

migrate:
	$(python) manage.py migrate

seed-db: migrate
	$(python) manage.py seed_db --flush

sync-geodata: migrate
	$(python) manage.py sync_geodata

open-api-schema:
	$(python) manage.py spectacular --format openapi-json --validate > schema.json

tests:
	uv run pytest -vvv -s $(NAME)

run-indexer: migrate
	$(python) manage.py indexer

run-reaper: migrate
	$(python) manage.py reaper

run-telegram-bot: migrate
	$(python) manage.py telegram_bot

run-server: migrate
	$(python) manage.py runserver $$BACKEND_PORT

run-ipfs-node:
	test -n "$(IPFS_STAGING)" || exit 1
	test -n "$(IPFS_DATA)" || exit 1
	mkdir -p $$IPFS_STAGING
	mkdir -p $$IPFS_DATA
	$(VIRTUALIZER) stop $(ipfs_container_name) || true
	$(VIRTUALIZER) rm $(ipfs_container_name) || true
	$(VIRTUALIZER) run --rm -d \
		--name $(ipfs_container_name) \
		--userns=keep-id \
		-v $$IPFS_STAGING:/export \
		-v $$IPFS_DATA:/data/ipfs \
		-p $$IPFS_SWARM_PORT:4001 \
		-p $$IPFS_SWARM_PORT:4001/udp \
		-p 127.0.0.1:$$IPFS_GATEWAY_PORT:8080 \
		-p 127.0.0.1:$$IPFS_API_PORT:5001 \
		docker.io/ipfs/go-ipfs:v0.7.0

run-valkey:
	$(VIRTUALIZER) stop $(valkey_container_name) || true
	$(VIRTUALIZER) rm $(valkey_container_name) || true
	$(VIRTUALIZER) run --rm -d \
		--name $(valkey_container_name) \
		-p $$VALKEY_PORT:6379 \
		docker.io/valkey/valkey:8.1.1

podman-build:
	cp -r ../ethereum/artifacts ./ethereum_artifacts_temp
	test -n "$(BACKEND_IMAGE)" || exit 1
	podman build --tag $(BACKEND_IMAGE) .
	rm -rf ./ethereum_artifacts_temp

gen-types:
	uv run manage.py generate_types
