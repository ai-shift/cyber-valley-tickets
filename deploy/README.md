# Cyber Valley Tickets Deployment

Bash-based deployment system for deploying the Cyber Valley Tickets application to a fresh server.

## Prerequisites

- Fresh Debian/Ubuntu server with root access
- SSH access to the target server
- Domain name pointing to the server (for SSL certificates)
- Local machine with:
  - rsync
  - ssh
  - make
  - pnpm (for frontend builds)

## Quick Start

1. Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. Generate required secrets:
   ```bash
   # PostgreSQL password (random 32 chars)
   openssl rand -base64 32

   # Django secret key (random 64 chars)
   openssl rand -base64 64
   ```

3. Run full deployment:
   ```bash
   make setup
   ```

This will:
- Create the tickets user
- Install all dependencies (Podman, Caddy, PostgreSQL)
- Deploy backend and frontend
- Start all services
- Configure SSL with Let's Encrypt

## Configuration

### Required Environment Variables

Edit `.env` file:

```bash
# Server
TARGET_HOST=cyberia.my          # Your domain
TARGET_USER=tickets             # System user (don't change)

# Database
POSTGRES_USER=tickets
POSTGRES_PASSWORD=<generate>    # Use: openssl rand -base64 32
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=tickets

# Domain
DOMAIN_NAME=cyberia.my          # Your domain

# Django
DJANGO_SECRET_KEY=<generate>    # Use: openssl rand -base64 64
DJANGO_DEBUG=0

# Ethereum (populate after ethereum deployment)
PUBLIC_EVENT_MANAGER_ADDRESS=<from ethereum deploy>
PUBLIC_EVENT_TICKET_ADDRESS=<from ethereum deploy>
PUBLIC_ERC20_ADDRESS=<from ethereum deploy>
BACKEND_EOA_PRIVATE_KEY=<from ethereum deploy>

# External APIs
TELEGRAM_BOT_TOKEN=<from @BotFather>
PUBLIC_GOOGLE_MAPS_API_KEY=<from Google Cloud Console>
PUBLIC_THIRDWEB_PUBLIC_CLIENT_ID=<from Thirdweb>
```

## Makefile Commands

### Setup Commands
- `make setup` - Full fresh deployment (user + deps + deploy + start)
- `make setup-user` - Create tickets user only
- `make install-deps` - Install system dependencies only

### Deployment Commands
- `make deploy-backend` - Deploy backend services (rsync + systemd + containers)
- `make deploy-frontend` - Build and deploy frontend (local build + rsync)
- `make deploy-all` - Deploy both backend and frontend

### Service Management
- `make start` - Start all services
- `make stop` - Stop all services
- `make restart` - Restart all services
- `make status` - Show status of all services

### Logging
- `make logs` - Tail logs from all services
- `make logs-backend` - Tail backend API logs
- `make logs-indexer` - Tail indexer logs
- `make logs-reaper` - Tail reaper logs
- `make logs-telegram` - Tail telegram bot logs

## Architecture

### Services

**Backend Services** (systemd + uv):
- `tickets-backend` - Django API server (port 8100)
- `tickets-indexer` - Blockchain event listener
- `tickets-reaper` - Auto-cancel events not meeting minimums
- `tickets-telegram` - Telegram bot for wallet linking

**Containers** (Podman):
- `cvland-ipfs` - IPFS node (ports 5001, 8110, 4001)
- `ganache-node` - Local Ethereum test node (port 8120)

**Infrastructure** (native):
- PostgreSQL 15 (database)
- Valkey/Valkey (cache)
- Caddy (web server + reverse proxy + auto-SSL)
- Tracer collector (sends logs to tracer.aishift.co)

### Directory Structure

```
deploy/
├── Makefile              # Main interface
├── .env                  # Configuration (create from .env.example)
├── scripts/              # Deployment scripts
│   ├── 01-setup-user.sh
│   ├── 02-install-deps.sh
│   ├── 03-setup-postgres.sh
│   ├── 04-deploy-backend.sh
│   ├── 05-deploy-frontend.sh
│   ├── 06-setup-caddy.sh
│   ├── 07-start-ipfs.sh
│   ├── 08-start-ganache.sh
│   ├── 09-start-valkey.sh
│   └── 10-setup-tracer.sh
└── templates/            # Service templates
    ├── tickets-backend.service
    ├── tickets-indexer.service
    ├── tickets-reaper.service
    ├── tickets-telegram.service
    ├── tracer-collector.service
    ├── collector.toml
    └── Caddyfile
```

### Server Directory Structure

```
/home/tickets/
├── backend/              # Django application
├── client/
│   └── dist/            # Built frontend (served by Caddy)
└── data/
    └── ipfs/            # IPFS data directories
        ├── data/
        └── staging/

/etc/
├── env/
│   └── tickets.env      # Environment variables for services
├── caddy/
│   └── sites/
│       └── cyberia.my   # Caddy site configuration
├── tracer/
│   └── collector.toml   # Tracer collector config
└── systemd/system/      # Service definitions
```

## Deployment Flow

When you run `make setup`, the following happens:

1. **User Setup** (01-setup-user.sh)
   - Creates `tickets` user with home directory
   - Copies SSH keys from root
   - Creates directory structure

2. **Dependencies** (02-install-deps.sh, 03-setup-postgres.sh)
   - Installs Podman with fuse-overlayfs driver
   - Installs Caddy web server
   - Installs PostgreSQL 15
   - Installs uv and pnpm
   - Creates database and user

3. **Backend Deployment** (04-deploy-backend.sh)
   - Rsyncs backend code
   - Installs Python dependencies with uv
   - Runs database migrations
   - Creates environment file
   - Installs systemd services

4. **Frontend Deployment** (05-deploy-frontend.sh)
   - Builds frontend locally with pnpm
   - Rsyncs built files to server

5. **Caddy Setup** (06-setup-caddy.sh)
   - Installs Caddyfile for the domain
   - Configures reverse proxy
   - Enables auto-SSL with Let's Encrypt

6. **Container Services** (07-09)
   - Starts IPFS container
   - Starts Ganache Ethereum node
   - Installs and starts Valkey/Valkey natively

7. **Observability** (10-setup-tracer.sh)
   - Fetches API key from aishift.co
   - Installs tracer-collector
   - Starts sending logs to central panel

8. **Service Start**
   - Starts all systemd services
   - Verifies startup

## Updating Deployments

### Update Backend Only
```bash
make deploy-backend
make restart
```

### Update Frontend Only
```bash
make deploy-frontend
# No restart needed (static files)
```

### Update Both
```bash
make deploy-all
make restart
```

## Troubleshooting

### Check Service Status
```bash
make status
```

### View Logs
```bash
make logs-backend    # Backend API
make logs-indexer    # Blockchain indexer
make logs-reaper     # Event reaper
make logs-telegram   # Telegram bot
```

### SSH to Server
```bash
ssh root@cyberia.my
# or
ssh tickets@cyberia.my
```

### Check Containers
```bash
ssh root@cyberia.my "podman ps"
```

### Check Valkey/Valkey
```bash
ssh root@cyberia.my "systemctl status valkey-server"
# or
ssh root@cyberia.my "systemctl status redis-server"
ssh root@cyberia.my "redis-cli ping"
```

### Check Database
```bash
ssh root@cyberia.my "psql -U tickets -h 127.0.0.1 -d tickets"
```

### Restart Individual Service
```bash
ssh root@cyberia.my "systemctl restart tickets-backend"
```

## Security Notes

- All services run as the `tickets` user (not root)
- Systemd services have security hardening enabled
- Caddy automatically provisions SSL certificates
- PostgreSQL only accepts local connections
- Environment variables stored in `/etc/env/tickets.env` (mode 600)

## Monitoring

All logs are sent to the centralized tracer panel at `https://tracer.aishift.co`

You can also view logs directly:
```bash
make logs               # All services
make logs-backend       # Specific service
```

## Migration from Ansible

This deployment replaces the previous Ansible-based setup with:
- Simpler bash scripts instead of Ansible playbooks
- Caddy instead of Nginx (simpler config, auto-SSL)
- Native systemd services instead of containerized backend
- Native Valkey/Valkey instead of containerized
- Same functionality, easier to maintain

## Support

For issues or questions:
- Check logs with `make logs`
- Check service status with `make status`
- SSH to server for detailed debugging
- Review script source in `deploy/scripts/`
