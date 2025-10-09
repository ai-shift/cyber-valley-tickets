# Indexer Test Snapshots

This directory contains snapshot files for indexer tests. Each snapshot captures the blockchain events emitted during a specific Hardhat test suite.

## How It Works

1. **Snapshot Generation**: Run `make update-indexer-snapshots` from the `backend/` directory
   - Requires a running Hardhat node on `http://localhost:8545`
   - Automatically resets blockchain state between test captures
2. **Test Execution**: Tests in `test_indexer.py` compare actual events against these snapshots
3. **Maintenance**: When Ethereum tests change, regenerate snapshots to keep tests in sync

## File Structure

Each snapshot file is named after the Hardhat test suite it captures:
- `createEventPlace.json` - Events from the "createEventPlace" test suite
- `updateEventPlace.json` - Events from the "updateEventPlace" test suite
- `submitEventRequest.json` - Events from the "submitEventRequest" test suite
- `approveEvent.json` - Events from the "approveEvent" test suite
- `declineEvent.json` - Events from the "declineEvent" test suite
- `updateEvent.json` - Events from the "updateEvent" test suite

**Note**: The `cancelEvent` test suite is excluded due to time-manipulation complexities that make it incompatible with blockchain snapshots.

## Snapshot Format

Each JSON file contains:
```json
{
  "test_name": "testName",
  "events_count": 42,
  "events_by_type": {
    "ModuleName.EventName": [
      { "field1": "value1", "field2": "value2" }
    ]
  }
}
```

## Updating Snapshots

When Ethereum contract tests are modified:

1. Start a Hardhat node: `cd ethereum && pnpm exec hardhat node`
2. In another terminal, run: `cd backend && make update-indexer-snapshots`
3. Review the changes with `git diff`
4. Commit the updated snapshot files if changes are intentional

## Advantages of Snapshot Testing

- **Easy Maintenance**: No need to manually update hardcoded assertions when contract events change
- **Comprehensive**: Captures all events automatically, ensuring nothing is missed
- **Clear Intent**: Test failures show exact differences between expected and actual events  
- **Quick Updates**: Single command regenerates all snapshots

## Troubleshooting

**Error: Snapshot file not found**
- Run `make update-indexer-snapshots` to generate missing snapshots

**Error: Cannot connect to hardhat node**
- Ensure Hardhat node is running: `cd ethereum && pnpm exec hardhat node`

**Test failures after updating contract tests**
- This is expected - regenerate snapshots with `make update-indexer-snapshots`
- Review the diff to ensure changes are intentional before committing

**Snapshots seem stale or wrong**
- Kill any existing Hardhat node processes
- Start a fresh node and regenerate snapshots
