# Indexer Test Snapshots

This directory contains snapshot files for indexer tests. Each snapshot captures the blockchain events emitted during a specific Hardhat test suite.

## How It Works

1. **Automatic Snapshot Creation**: When tests detect a mismatch between actual events and snapshots:
   - A new snapshot file is automatically created with `new_` prefix
   - The test fails with instructions on how to review and accept the changes
   - Simply move the new file to replace the old one if changes are correct
2. **Test Execution**: Tests in `test_indexer.py` compare actual events against these snapshots
3. **First Run**: If a snapshot doesn't exist, the test will create it automatically with `new_` prefix

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

1. Run the indexer tests: `cd backend && make tests` (or run a specific test)
2. If events have changed, tests will fail and create `new_*.json` files
3. Review the new snapshot: `cat cyber_valley/indexer/service/snapshots/new_testName.json`
4. If changes are correct, replace the old snapshot:
   ```bash
   cd backend/cyber_valley/indexer/service/snapshots
   mv new_testName.json testName.json
   ```
5. Re-run tests to verify they pass
6. Commit the updated snapshot files

**Example workflow:**
```bash
# Run tests
cd backend && pytest cyber_valley/indexer/service/test_indexer.py::test_approve_event -v

# Test fails with message about new_approveEvent.json created
# Review the diff
diff snapshots/approveEvent.json snapshots/new_approveEvent.json

# If changes look good, accept them
cd cyber_valley/indexer/service/snapshots
mv new_approveEvent.json approveEvent.json

# Verify test passes
cd ../../../.. && pytest cyber_valley/indexer/service/test_indexer.py::test_approve_event -v

# Commit
git add cyber_valley/indexer/service/snapshots/approveEvent.json
git commit -m "backend: update approveEvent snapshot for new contract behavior"
```

## Advantages of Snapshot Testing

- **Fully Automatic**: Tests auto-generate snapshots when events change - no manual commands needed
- **Easy Maintenance**: No hardcoded assertions to update when contract events change
- **Comprehensive**: Captures all events automatically, ensuring nothing is missed
- **Clear Failures**: Test output shows exact file location and review instructions
- **Simple Workflow**: Run test → review diff → move file → commit
- **Developer Friendly**: No need to start external services or run special commands

## Troubleshooting

**Error: Snapshot file not found**
- This happens on first test run or if snapshot was deleted
- Run the test once to auto-generate the snapshot with `new_` prefix
- Review and move it to accept: `mv new_testName.json testName.json`

**Test failures with "new_*.json created"**
- This is normal behavior when events change
- Review the new snapshot file to ensure changes are expected
- Use `diff` to compare: `diff testName.json new_testName.json`
- Move the file to accept: `mv new_testName.json testName.json`
- Re-run tests to verify

**Tests start their own Hardhat node**
- Each test automatically starts and stops its own Hardhat node
- No need to manually start a node before running tests
- If tests hang, kill any stray processes: `pkill -f "hardhat node"`

**Snapshots seem stale or wrong**
- Delete the snapshot file: `rm testName.json`
- Run the test to regenerate: test will create `new_testName.json`
- Review and accept it: `mv new_testName.json testName.json`

**Multiple `new_*.json` files accumulating**
- These are created when tests fail with mismatched events
- Review and either accept (move to replace old) or reject (delete) them
- `.gitignore` prevents accidental commits of `new_*.json` files
