# Cyber Valley Tickets Deployment

Deployment is now intentionally split into 3 simple operations.

## 1) One-time system setup

Runs all root/system-level setup in one place:
- user/directories
- packages (postgres, caddy, podman, cache)
- systemd unit installation
- caddy site config
- ipfs/ganache containers
- `/etc/env/tickets.env` generation from `deploy/.env`

```bash
cd deploy
make setup-system
```

## 2) Backend deploy

Single script for backend updates:
- rsync backend code + ethereum artifacts
- refresh `/etc/env/tickets.env`
- `uv sync`
- migrations
- restart backend services (`tickets-backend`, `tickets-indexer`, `tickets-telegram`)

```bash
cd deploy
make deploy-backend
```

## 3) Frontend deploy

Local build + rsync only:

```bash
cd deploy
make deploy-frontend
```

## Combined deploy

```bash
cd deploy
make deploy-all
```

## Ops commands

```bash
cd deploy
make status
make logs
make logs-backend
make logs-indexer
make logs-telegram
```

## Required local config

Create `deploy/.env` from `deploy/.env.example` and fill required values.

```bash
cd deploy
cp .env.example .env
```
