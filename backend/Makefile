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
