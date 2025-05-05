format:
	uv run ruff format

lint: format
	uv run ruff check --fix
	uv run mypy .

pre-commit: lint

run:
	uv run python manage.py runserver

generate-requirements:
	uv export --no-hashes --format requirements-txt > requirements.txt

make-migrations:
	uv run manage.py makemigrations

migrate: make-migrations
	uv run manage.py migrate

seed-db: migrate
	uv run manage.py seed_db --flush

open-api-schema:
	uv run manage.py spectacular --format openapi-json --validate > schema.json

tests:
	uv run pytest -vvv -s


run-ipfs-node:
	test -n "$(IPFS_STAGING)" || exit 1
	test -n "$(IPFS_DATA)" || exit 1
	docker run --rm -d \
		--name cyber-valley-ipfs \
		-v $$IPFS_STAGING:/export \
		-v $$IPFS_DATA:/data/ipfs \
		-p 4001:4001 \
		-p 4001:4001/udp \
		-p 127.0.0.1:8080:8080 \
		-p 127.0.0.1:5001:5001 \
		ipfs/go-ipfs:v0.7.0

run-valkey:
	docker run --rm -d \
		--name cyber-valley-valkey \
		-p 6379:6379 \
		valkey/valkey:8.1.1
