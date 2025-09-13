# Agents Guidelines for Cyber Valley Tickets

## Build/Lint/Test Commands
- **Client:** `cd client && make check` (biome), `make compile` (tsc), `make build`, `make dev`
- **Backend:** `cd backend && make lint` (ruff + mypy), `make tests` (pytest), `make run`
- **Ethereum:** `cd ethereum && make compile`, `make tests`, `make check` (biome)
- **Global:** `make pre-commit` (runs all linting), `make install` (setup deps)

## Code Style Guidelines
- **TypeScript/JS:** Use Biome formatter, double quotes, semicolons, space indentation
- **Python:** Use Ruff + MyPy, strict typing, Django conventions, snake_case
- **Imports:** Auto-organized by Biome/Ruff, group by external/internal
- **Types:** Strict TypeScript, Python type hints required, use ClassVar for class attributes
- **Naming:** camelCase (TS), snake_case (Python), PascalCase (components/classes)
- **Error Handling:** Use Result types (returns library) in Python, proper error boundaries in React

## Project Structure
- Multi-service: `client/` (React+Vite), `backend/` (Django), `ethereum/` (Hardhat)
- Package managers: pnpm (client/ethereum), uv (backend/ansible)
- API types auto-generated from backend schema to `client/src/shared/api/apiTypes.d.ts`

## Testing
- **Single test:** `cd backend && uv run pytest path/to/test.py::test_name -vvv -s`
- **Ethereum:** `cd ethereum && pnpm exec hardhat test --typecheck path/to/test.ts`