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
