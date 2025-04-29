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

update-open-api-schema:
	wget 'http://localhost:8000/schema?format=json' -O schema.json

seed_db: migrate
	uv run manage.py seed_db --flush
