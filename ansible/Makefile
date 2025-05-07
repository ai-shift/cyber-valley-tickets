ansible-playbook = uv run ansible-playbook

install-collections:
	uv run ansible-galaxy install -r requirements.yml

lint:
	uv run yamllint *.yml vars/*.yml
	uv run ansible-lint --fix deploy.yml

deploy-postgres: install-collections
	$(ansible-playbook) postgres.yml

deploy-ganache: install-collections
	$(ansible-playbook) ganache.yml
