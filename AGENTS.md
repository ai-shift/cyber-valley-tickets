# Agents Guidelines for Cyber Valley Tickets

## Project Overview

Cyber Valley Tickets is a Web3 mobile-first web application for event management on Ethereum. It allows event creators (shamans) to submit event requests, masters to approve them, customers to buy tickets with crypto, and staff to verify tickets at events.

**Core Functionality:**
- Event lifecycle management (request → approve → active → closed/cancelled)
- NFT-based ticketing system on Ethereum
- On-chain revenue distribution between creator, master, and dev team
- Web3 wallet authentication with JWT cookies
- Telegram bot integration for wallet linking
- IPFS for metadata storage
- QR code-based ticket verification

## Technology Stack

### Frontend (client/)
- **Framework:** React 19.1.0 + TypeScript 5.7
- **Build Tool:** Vite 6.3.4 with SWC
- **Styling:** Tailwind CSS 4.1.5 + shadcn/ui components
- **State Management:** Zustand 5.0.4
- **Web3:** Thirdweb SDK 5.97.3 + Ethers.js
- **Routing:** React Router 7.5.3
- **Query:** TanStack Query (React Query) 5.75.2
- **Forms:** React Hook Form 7.56.2 + Zod validation
- **Package Manager:** pnpm 10.11.0

### Backend (backend/)
- **Framework:** Django 5.2 + Django REST Framework
- **Language:** Python 3.13+
- **Package Manager:** uv (modern Python package manager)
- **Database:** SQLite (dev) / PostgreSQL 15 (prod)
- **Cache:** Valkey (Redis-compatible) via django-redis
- **Authentication:** Custom Web3 JWT with cookie-based auth
- **API Documentation:** drf-spectacular with OpenAPI 3
- **Type Safety:** strict mypy with django-stubs

### Ethereum (ethereum/)
- **Framework:** Hardhat 2.22.19 with TypeScript
- **Solidity Version:** 0.8.28
- **Testing:** Hardhat Toolbox + Chai matchers
- **Contract Standards:** OpenZeppelin Contracts 5.3.0
- **Type Generation:** TypeChain
- **Networks:** Local Ganache, cvlandTest, cvlandDev, cyberia

### Infrastructure
- **Container Runtime:** Podman (rootless containers)
- **Web Server:** Caddy (auto-SSL with Let's Encrypt)
- **File Storage:** IPFS (go-ipfs v0.7.0)
- **Process Management:** systemd
- **Deployment:** Bash-based deployment scripts

## Project Structure

```
tickets/
├── client/                     # React frontend
│   ├── src/
│   │   ├── app/               # App initialization, providers, global styles
│   │   ├── entities/          # Business entities (event, user, place, etc.)
│   │   ├── features/          # Feature modules (login, purchase, etc.)
│   │   ├── pages/             # Page components (route-level)
│   │   ├── shared/            # Shared utilities, API, UI components
│   │   │   ├── api/           # API client and auto-generated types
│   │   │   ├── hooks/         # Shared React hooks
│   │   │   ├── lib/           # Utility functions
│   │   │   ├── ui/            # Base UI components (shadcn)
│   │   │   └── widgets/       # Shared widget components
│   │   └── widgets/           # Complex reusable widgets
│   ├── public/                # Static assets
│   └── package.json
├── backend/                    # Django backend
│   ├── cyber_valley/          # Main Django project
│   │   ├── custom_auth/       # Custom authentication (SMS mock)
│   │   ├── events/            # Event management views/models
│   │   ├── geodata/           # Geospatial data management
│   │   ├── health/            # Health check endpoints
│   │   ├── indexer/           # Blockchain event indexer
│   │   │   └── service/       # Event processing services
│   │   ├── notifications/     # User notifications
│   │   ├── scripts/           # Management commands
│   │   ├── shaman_verification/  # Shaman KYC verification
│   │   ├── telegram_bot/      # Telegram bot for wallet linking
│   │   ├── users/             # User management
│   │   └── web3_auth/         # Web3 wallet authentication
│   ├── manage.py
│   └── pyproject.toml
├── ethereum/                   # Smart contracts
│   ├── contracts/             # Solidity contracts
│   │   ├── CyberValleyEventManager.sol    # Main event management
│   │   ├── CyberValleyEventTicket.sol     # NFT ticket contract
│   │   ├── DynamicRevenueSplitter.sol     # Revenue distribution
│   │   ├── ENSRegistry.sol                # Local ENS for dev
│   │   └── mocks/SimpleERC20Xylose.sol    # Test ERC20 token
│   ├── scripts/               # Deployment and utility scripts
│   ├── artifacts/             # Compiled contract artifacts
│   └── hardhat.config.ts
├── deploy/                     # Production deployment
│   ├── scripts/               # Deployment bash scripts
│   ├── templates/             # systemd/Caddy templates
│   └── Makefile
├── ansible/                    # Legacy Ansible playbooks
├── docs/                       # Additional documentation
└── launch.sh                   # Development environment launcher
```

## Build/Lint/Test Commands

### Global (project root)
```bash
make install          # Install all dependencies (uv + pnpm)
make pre-commit       # Run all linting across projects
make dev              # Start full development environment
```

### Client (client/)
```bash
cd client
make dev              # Start Vite dev server
make build            # Production build
make check            # Biome lint and format
make compile          # TypeScript type check
make openapi-types    # Generate API types from backend schema
```

### Backend (backend/)
```bash
cd backend
make lint             # Ruff + mypy
make tests            # Run pytest
make run              # Run Django dev server (with deps)
make seed-db          # Seed database with initial data
make sync-geodata     # Sync geospatial data
make run-indexer      # Start blockchain indexer
make run-telegram-bot # Start Telegram bot
make open-api-schema  # Generate OpenAPI schema
```

### Ethereum (ethereum/)
```bash
cd ethereum
make compile          # Compile contracts + generate TypeChain types
make tests            # Run Hardhat tests
make check            # Biome lint
make ganache          # Start local Ganache node
make deploy-dev       # Deploy to local dev network
make deploy-and-seed  # Deploy + seed events/tickets
make grant-backend-role  # Grant backend role for indexing
```

## Code Style Guidelines

### TypeScript/JavaScript
- **Formatter:** Biome 1.9.4
- **Indent:** 2 spaces
- **Quotes:** Double quotes
- **Semicolons:** Always
- **Import organization:** Automatic via Biome
- **Strict TypeScript:** Enabled with strict null checks

### Python
- **Linter:** Ruff (replaces flake8, black, isort)
- **Type Checker:** mypy with strict mode
- **Style:** PEP 8 with snake_case
- **Type Hints:** Required for all functions
- **Line Length:** 88 (Black-compatible)
- **Import Style:** Grouped by external, then internal

### Solidity
- **Style:** Prettier with prettier-plugin-solidity
- **Linter:** Solhint
- **Version:** 0.8.28 with optimizer (200 runs, viaIR enabled)

## Testing Instructions

### Backend Tests
```bash
# Run all tests
cd backend && make tests

# Run specific test
cd backend && uv run pytest cyber_valley/events/test_views.py::TestEventViewSet -vvv -s

# Run indexer tests
cd backend && make test-indexer
```

### Ethereum Tests
```bash
# Run all tests
cd ethereum && make tests

# Run specific test file
cd ethereum && pnpm exec hardhat test --typecheck test/EventManager.test.ts
```

### Client Tests
No test runner configured. Tests should be run manually via browser.

## Entity Ownership (Source of Truth)

| Entity | Created By | Populated By | Source of Truth |
|--------|------------|--------------|-----------------|
| Event | `ethereum/scripts/deploy-dev.js` → `submitEventRequest()` | Indexer (from `EventCreated` event) | Contract |
| EventPlace | `ethereum/scripts/deploy-dev.js` → `submitEventPlaceRequest()` | Indexer (from `NewEventPlaceRequest` event) | Contract |
| Ticket | `ethereum/scripts/mint-tickets.js` → `mintTickets()` | Indexer (from `TicketMinted` event) | Contract |
| CyberValleyUser | `seed_db.py` or API auth | `seed_db.py` / API | Database |
| UserSocials | `seed_db.py` or Telegram bot | `seed_db.py` / Bot | Database |
| VerificationRequest | API (`shaman_verification/views.py`) | API (off-chain) | Database |
| Role (on-chain) | Contract `grantRole()` | Indexer (from `RoleGranted` event) | Contract |

**Important Rules:**
1. **Contract entities** (Event, EventPlace, Ticket, Role) are created ON-CHAIN only, never directly in DB
2. **Database entities** (User, UserSocials, VerificationRequest) are created via API/seed scripts
3. **Indexer** syncs contract state to DB - it's the ONLY writer of contract entities to DB
4. **NEVER** create Event/EventPlace/Ticket directly in Django admin or seed scripts

## Development Environment

### Prerequisites
- Node.js 20+ with pnpm
- Python 3.13+ with uv
- Podman (or Docker)
- tmux

### Environment Setup
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Install dependencies
make install

# Start development environment
make dev
```

The `launch.sh` script sets up:
1. Ganache blockchain node (local Ethereum)
2. Django backend server
3. Vite frontend dev server
4. IPFS node (for metadata storage)
5. Valkey cache
6. Blockchain indexer
7. Telegram bot

Access via tmux: `tmux attach -t cyber-valley-dev`

## API Type Generation

API types are auto-generated from the backend OpenAPI schema:

```bash
# Backend: generate schema
cd backend && make open-api-schema

# Client: generate types
cd client && make openapi-types
```

Generated file: `client/src/shared/api/apiTypes.d.ts`

## Deployment

### Staging Deployment (aishift.co)
```bash
# 1. Commit and push
git add -A
git commit -m "your commit message"
git push origin dev

# 2. SSH to server and pull updates
ssh cvland@aishift.co
cd ~/tickets
git stash  # if there are local changes
git pull origin dev

# 3. Run with production frontend build
make dev ARGS="--production-frontend"
```

### Production Deployment (fresh server)
```bash
cd deploy/
cp .env.example .env
# Edit .env with production values

make setup  # Full deployment
```

See `deploy/README.md` for detailed deployment documentation.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (created from `.env.example`) |
| `client/vite.config.ts` | Vite build configuration with proxy rules |
| `client/biome.json` | Biome linter/formatter configuration |
| `client/tsconfig.json` | TypeScript compiler options |
| `backend/pyproject.toml` | Python dependencies, ruff, mypy, pytest config |
| `ethereum/hardhat.config.ts` | Hardhat network and compiler settings |
| `launch.sh` | Development environment orchestration |

## Security Considerations

- **Private Keys:** Never commit private keys. Use `.env` files only.
- **Backend EOA:** The backend uses a designated EOA for blockchain transactions. Keep its private key secure.
- **JWT Tokens:** Access tokens (24h) and refresh tokens (60 days) stored in HTTP-only cookies.
- **CORS:** Strictly configured in Django settings.
- **Production:** Django `DEBUG=False`, secure cookies enabled.

## Common Development Tasks

### Reset Everything (Clean Start)
```bash
./launch.sh --stop  # Stop all services
rm backend/db.sqlite3  # Remove database
./launch.sh  # Full restart
```

### Regenerate Contract Types
```bash
cd ethereum && make compile
```

### Update API Types After Backend Changes
```bash
cd backend && make open-api-schema
cd client && make openapi-types
```

### Run Single Indexer Cycle (for debugging)
```bash
cd backend && make run-indexer-oneshot
```

## Troubleshooting

### Port Conflicts
Check `.env` for port configuration:
- `BACKEND_PORT=8000`
- `VITE_PORT=5173`
- `GANACHE_PORT=8545`
- `IPFS_*_PORT` various

### Contract Address Mismatch
After `deploy-and-seed`, contract addresses are auto-updated in `.env`. If services can't find contracts:
1. Check `.env` has correct addresses
2. Restart backend and frontend

### Database Locked (SQLite)
```bash
rm backend/db.sqlite3-*  # Remove WAL files
```

### IPFS Not Responding
```bash
podman stop cvland-ipfs
podman rm cvland-ipfs
# Relaunch will recreate
```

## Useful Links

- API Documentation: `http://localhost:8000/` (Swagger UI when backend running)
- Hardhat Console: `cd ethereum && pnpm exec hardhat console --network cvlandDev`
- Django Admin: `http://localhost:8000/admin/` (requires superuser)

## API Schema Generation Best Practices

We use **drf-spectacular** for OpenAPI schema generation and **openapi-typescript** for TypeScript types. Follow these patterns to maintain clean, complete API documentation.

### Function-Based Views with @api_view

Always add `@extend_schema` decorator with explicit request and response serializers:

```python
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view

@extend_schema(
    request=MyRequestSerializer,
    responses={
        200: MyResponseSerializer,
        400: ErrorResponseSerializer,
    },
)
@api_view(["POST"])
def my_view(request: Request) -> Response:
    ...
```

For views with no request body (e.g., GET, DELETE):

```python
@extend_schema(
    responses={
        204: None,  # No content
        200: {"type": "string"},  # Simple response
    },
)
@api_view(["GET"])
def my_view(request: Request) -> Response:
    ...
```

### ViewSet Path Parameters

Always specify path parameter types using `lookup_field` or `@extend_schema_view`:

```python
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter

@extend_schema_view(
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=int,  # or str
                location=OpenApiParameter.PATH,
                description="Resource ID",
            ),
        ],
    ),
)
class MyViewSet(viewsets.ReadOnlyModelViewSet[MyModel]):
    serializer_class = MySerializer
    lookup_field = "id"  # Must match the URL parameter name
```

For custom `@action` endpoints:

```python
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="custom_param",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
        ),
    ],
    responses={204: OpenApiResponse()},
)
@action(detail=False, methods=["post"], url_path="path/(?P<custom_param>[^/.]+)")
def custom_action(self, request: Request, custom_param: str) -> Response:
    ...
```

### Avoiding OperationId Collisions

When multiple endpoints would generate the same operationId, use explicit `operation_id`:

```python
@extend_schema(
    operation_id="api_resources_action_unique",  # Unique name
    responses={...},
)
```

Common collision patterns to avoid:
- `/api/items/{id}/status` and `/api/items/{id}/status/{status}` both default to `api_items_status_retrieve`
- Fix by adding explicit `operation_id` like `api_items_status_get` and `api_items_status_update`

### Enum Naming

When multiple models have fields named the same (e.g., `status`), add `ENUM_NAME_OVERRIDES` to `SPECTACULAR_SETTINGS` in `settings.py`:

```python
SPECTACULAR_SETTINGS = {
    "ENUM_NAME_OVERRIDES": {
        "EventStatusEnum": "cyber_valley.events.models.Event.STATUS_CHOICES",
        "TicketStatusEnum": "cyber_valley.events.models.Ticket.STATUS_CHOICES",
    },
}
```

### Regenerating Types

After backend changes:

```bash
# Generate OpenAPI schema (must have backend env vars set)
cd backend
export DJANGO_SECRET_KEY=...  # and other required env vars
make open-api-schema

# Generate TypeScript types
cd ../client
make openapi-types
```

### Troubleshooting Schema Issues

**"Unable to guess serializer" Error**
- Cause: Function-based view without `@extend_schema` decorator
- Fix: Add explicit `@extend_schema(request=..., responses=...)` decorator

**"Could not derive type of path parameter" Warning**
- Cause: ViewSet without `lookup_field` or path parameter annotation
- Fix: Add `lookup_field = "id"` or use `@extend_schema_view` with `OpenApiParameter`

**"OperationId collision" Warning**
- Cause: Multiple endpoints with same operationId
- Fix: Add explicit `operation_id` parameter to `@extend_schema`

**"Enum naming collision" Warning**
- Cause: Multiple fields with same name having choices
- Fix: Add entries to `ENUM_NAME_OVERRIDES` in settings

### Testing Schema Generation

Run this to verify schema generation produces no errors:

```bash
cd backend
export DJANGO_SECRET_KEY=test-key  # minimal env vars
export PUBLIC_HTTP_ETH_NODE_HOST=http://localhost:8545
export WS_ETH_NODE_HOST=ws://localhost:8545
export VALKEY_HOST=redis://localhost:6379
export IPFS_DATA=/tmp/ipfs
export IPFS_PUBLIC_HOST=http://localhost:8080
export DB_NAME=test_db
export DB_USER=test_user
export DB_PASSWORD=test_pass
export PUBLIC_EVENT_MANAGER_ADDRESS=0x...
export PUBLIC_EVENT_TICKET_ADDRESS=0x...
export PUBLIC_ERC20_ADDRESS=0x...
export BACKEND_EOA_PRIVATE_KEY=0x...
export ALLOWED_HOSTS=localhost

# Should produce 0 errors
uv run manage.py spectacular --format openapi-json --validate 2>&1 | grep -E "^Errors"
```

Expected output: `Errors:   0 (0 unique)`
