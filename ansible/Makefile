ansible-playbook = uv run ansible-playbook

lint:
	uv run yamllint *.yml vars/*.yml
	uv run ansible-lint --fix deploy.yml

deploy-staging-backend:
	$(ansible-playbook) -e "stage=staging" -e "service_to_deploy=backend" deploy.yml

deploy-staging-frontend:
	$(ansible-playbook) -e "stage=staging" -e "service_to_deploy=frontend" deploy.yml

deploy-production-backend:
	$(ansible-playbook) -e "stage=production" -e "service_to_deploy=backend" deploy.yml

deploy-production-frontend:
	$(ansible-playbook) -e "stage=production" -e "service_to_deploy=frontend" deploy.yml
