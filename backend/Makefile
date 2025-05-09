ipfs_container_name := "cyber-valley-ipfs"
valkey_container_name := "cyber-valley-valkey"
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

migrate: make-migrations
	$(python) manage.py migrate

seed-db: migrate
	$(python) manage.py seed_db --flush

open-api-schema:
	$(python) manage.py spectacular --format openapi-json --validate > schema.json

tests:
	$(python) pytest -vvv -s

run-indexer: migrate
	$(python) manage.py indexer

run-server: migrate
	$(python) manage.py runserver

run-ipfs-node:
	test -n "$(IPFS_STAGING)" || exit 1
	test -n "$(IPFS_DATA)" || exit 1
	docker stop $(ipfs_container_name) || true
	docker rm $(ipfs_container_name) || true
	docker run --rm -d \
		--name $(ipfs_container_name) \
		-v $$IPFS_STAGING:/export \
		-v $$IPFS_DATA:/data/ipfs \
		-p 4001:4001 \
		-p 4001:4001/udp \
		-p 127.0.0.1:8080:8080 \
		-p 127.0.0.1:5001:5001 \
		ipfs/go-ipfs:v0.7.0

run-valkey:
	docker stop $(valkey_container_name) || true
	docker rm $(valkey_container_name) || true
	docker run --rm -d \
		--name $(valkey_container_name) \
		-p 6379:6379 \
		valkey/valkey:8.1.1

podman-build:
	cp -r ../ethereum/artifacts ./ethereum_artifacts
	test -n "$(BACKEND_IMAGE)" || exit 1
	podman build --tag $(BACKEND_IMAGE) .
	rm -rf ./ethereum_artifacts
