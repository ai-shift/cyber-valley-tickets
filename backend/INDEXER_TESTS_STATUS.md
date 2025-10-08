# Backend Indexer Tests Status

## Summary
After implementing LOCAL_PROVIDER role changes in smart contracts (69/70 ethereum tests passing), backend indexer integration tests need updates to match new event emissions.

## Fixed Tests ✅
- **test_create_event_place** - Role counts updated (14/7/7/14/7)
- **test_update_event_place** - EventPlaceUpdated count fixed (6 creates + 1 update = 7 total), removed duplicate assertion block

## Tests Needing Updates ❌

### test_submit_event_request
- **Issue**: NewEventRequest event structure or counts don't match ethereum test emissions
- **Ethereum test**: Runs ~11 tests (2 successful + 1 revert + 5 submit cases + 3 overlap cases)
- **Action needed**: Count actual EventPlaceUpdated and NewEventRequest events emitted

### test_approve_event  
- **Issue**: NewEventRequest structure mismatch - event not found in expected list
- **Action needed**: Update NewEventRequest expected data structure

### test_decline_event
- **Issue**: Similar NewEventRequest structure mismatch
- **Action needed**: Update NewEventRequest expected data structure

### test_update_event
- **Issue**: NewEventRequest structure mismatch  
- **Action needed**: Update NewEventRequest expected data structure

### test_cancel_event
- **Issue**: NewEventRequest structure mismatch
- **Action needed**: Update NewEventRequest expected data structure

## Sync Tests (test_sync.py)
- **test_sync_event_place_updated** - FAILED (not timeout related)
- **test_sync_event_place_updated_event_place_not_found** - TIMEOUT
- **test_sync_ticket_minted** - TIMEOUT
- **test_sync_ticket_minted_event_not_found** - TIMEOUT  
- **test_sync_new_event_request** - TIMEOUT

These are unit tests for sync functions, separate from integration tests. Timeouts suggest IPFS operation issues.

## Approach for Remaining Fixes

1. Run ethereum tests with event logging to capture actual emissions
2. For each failing backend test:
   - Identify which ethereum test(s) the grep pattern matches
   - Count EventPlaceUpdated, NewEventRequest, EventStatusChanged events
   - Update backend test expected counts/structures
3. Fix sync test timeouts (likely mock/IPFS related)

## Test Execution Notes
- Backend tests are SLOW (~2min+ for full suite)
- Must use `make tests` to load .env file (DJANGO_SECRET_KEY)
- Integration tests spawn hardhat node and run ethereum tests
- Each test uses `events_factory(grep_pattern)` to capture events from matching ethereum tests
