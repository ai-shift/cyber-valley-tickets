include ../.env.production

ansible-playbook = uv run ansible-playbook

install-collections:
	uv run ansible-galaxy install -r requirements.yml

lint:
	uv run yamllint *.yml vars/*.yml

deploy-setup-debian: install-collections
	ansible-playbook setup-debian.yml

deploy-postgres: install-collections
	$(ansible-playbook) postgres.yml

deploy-ganache: install-collections
	$(ansible-playbook) ganache.yml

deploy-backend: install-collections
	$(ansible-playbook) backend.yml

deploy-indexer: install-collections
	$(ansible-playbook) indexer.yml

deploy-reaper: install-collections
	$(ansible-playbook) reaper.yml

deploy-frontend: install-collections
	$(ansible-playbook) frontend.yml

deploy-nginx: install-collections
	$(ansible-playbook) nginx.yml

deploy-valkey: install-collections
	$(ansible-playbook) valkey.yml

deploy-ipfs: install-collections
	$(ansible-playbook) ipfs.yml

deploy-podman-cron-restart: install-collections
	$(ansible-playbook) podman-cron-start.yml
