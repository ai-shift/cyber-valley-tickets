# Cyber Valley Tickets - Repository Review (2026-02-03)

**Current Review**

## Scope & Method
This review is based on a repository-wide scan plus targeted deep reads of core files and hotspots. I did not open literally every file line-by-line (the repo is large), but I did cover:
- Root docs and build tooling: `README.md`, `AGENTS.md`, `Makefile`, `MILESTONE_REQUIREMENTS_ANALYSIS.md`, `REMAINING_TASKS.md`
- Core configs: `client/package.json`, `backend/pyproject.toml`, `ethereum/package.json`, `ethereum/hardhat.config.ts`, `backend/cyber_valley/settings.py`
- Critical backend flows: `backend/cyber_valley/events/views.py`, `backend/cyber_valley/events/models.py`, `backend/cyber_valley/indexer/service/_sync.py`
- Critical frontend flows: `client/src/app/providers/authProvider/ui/AuthProvider.tsx`, `client/src/features/ticket/ui/ShowTicket.tsx`, `client/src/features/ticket/ui/CategorySelect.tsx`
- TODO/FIXME scan across the repo via `rg`

If you want a truly exhaustive, file-by-file audit (including every component/test/migration), I can do that next in a separate pass and timebox it.

---

## Executive Summary
Strengths:
- Clear separation of concerns: on-chain source of truth, off-chain indexer, API, and client.
- Strong milestone coverage in core product functionality: categories, referrals, revenue split, deposits, lifetime revenue, multi-ticket display.
- Good DX and operational posture: `make` targets, structured tooling, IPFS integration, and standardized linting.

Key risks / bugs:
1. **Lifetime revenue calculation ignores category discounts** and always increments by `event.ticket_price`, which is incorrect when categories apply discounts.
2. **`Event.website` field lacks `max_length` in both model and migration**, which should be invalid in Django and could prevent migrations from running.
3. **Indexer creates `UserSocials` without schema validation**, which can crash on unexpected IPFS metadata shapes.

Major follow-ups:
- Resolve remaining milestone gaps (Thirdweb OneKey issue, referral provider selection, monitoring alerts, E2E testing, Mimi integration).
- Normalize money units and data types (USDT decimals) across contracts, backend, and UI.

---

## Architecture & Decision Review (with Pros/Cons)

### 1. On-chain Source of Truth + Off-chain Indexer
**Decision:** Contract events drive all core entities (Event, Ticket, EventPlace, Role); indexer writes to DB.
**Pros:** Strong integrity, auditable event history, consistent with Web3 expectations.
**Cons:** Indexer reliability becomes production-critical; any missed events cause data drift. Requires robust re-sync tooling and idempotent writes.

### 2. IPFS-based Metadata (Event/Place/Ticket/Order)
**Pros:** Decentralized storage, keeps chain payloads light, flexible schema evolution.
**Cons:** Runtime dependency on IPFS availability; metadata shape drift risks (seen in `_fetch_ticket_metadata` complexity).

### 3. Web3 Auth with JWT Cookies + SIWE Expiration
**Pros:** UX-friendly; cookie auth reduces friction; refresh logic minimizes re-signing.
**Cons:** Must be careful with account switch detection, token refresh race conditions, and client/server clock skew.

### 4. DynamicRevenueSplitter Contract
**Pros:** Clean separation of distribution logic from EventManager; flexible profiles; fixed platform shares enforced.
**Cons:** Adds another contract with its own admin surface; integration failures can stall revenue distribution.

### 5. Ticket Categories with Discounts & Quotas
**Pros:** Strong product flexibility; supports promotions and localized pricing.
**Cons:** Backend revenue and analytics must compute per-category price; otherwise metrics become inaccurate (currently a bug).

### 6. Referral System Embedded in Mint Events
**Pros:** Simple and reliable tracking; minimizes extra off-chain state.
**Cons:** Lacks full referral campaign management without external provider integration (still pending).

---

## Bugs & Weak Decisions (Actionable)

### 1. Lifetime Revenue ignores category discounts
**Evidence:** `backend/cyber_valley/indexer/service/_sync.py` increments `event.total_revenue += event.ticket_price` on each mint, regardless of category discounts.
**Impact:** Lifetime revenue shown via `/api/events/{event_id}/lifetime_revenue` is inflated for discounted categories.
**Fix:** Compute price per ticket from category discount (or store mint price in event or ticket metadata). Consider adding `price_paid` on Ticket.

### 2. `Event.website` missing `max_length`
**Evidence:** `backend/cyber_valley/events/models.py` and migration `0007_event_website.py` define `models.CharField()` without `max_length`.
**Impact:** Django normally raises at import/migration time. If migrations have been run, this is a latent correctness issue.
**Fix:** Change to `models.URLField(max_length=2048)` or `CharField(max_length=...)` and generate a migration.

### 3. Indexer can crash on missing socials keys
**Evidence:** `_sync_ticket_minted` creates `UserSocials` with `socials["network"]` and `socials["value"]` without validation.
**Impact:** If metadata lacks these keys, a KeyError can break event processing.
**Fix:** Validate keys, guard with `.get`, or skip create when missing.

### 4. IPFS file extension hard-assert
**Evidence:** `upload_event_meta_to_ipfs` asserts cover filename suffix.
**Impact:** File uploads without extension 500 the request.
**Fix:** Infer extension from MIME or accept extensionless uploads with a safe default.

### 5. Event revenue data types are undersized
**Evidence:** `ticket_price` is `PositiveSmallIntegerField`, `total_revenue` is `PositiveIntegerField` but described as “USDT (6 decimals)”.
**Impact:** If values are stored in smallest units, `PositiveSmallIntegerField` is too small. If values are stored as whole USDT, you lose precision.
**Fix:** Standardize to smallest units and use `PositiveBigIntegerField` (or DecimalField with strict quantization).

### 6. Multi-ticket dialog polling scalability
**Evidence:** `ShowTicket.tsx` uses `useQueries` per ticket and polls every second when dialog open.
**Impact:** N tickets -> N requests/second. This can overwhelm API for high-quantity buyers.
**Fix:** Add a batch status endpoint or reduce polling cadence and debounce.

---

## Refactoring / Rework Proposals (Pros & Cons)

### A. Normalize Money Handling
**Proposal:** Introduce a shared “Money in smallest units” convention across contracts, backend, and UI.
**Pros:** Correctness for revenue reporting, fee splits, and discount math.
**Cons:** Requires migrations and careful UI formatting.

### B. Track `price_paid` at Ticket level
**Pros:** Correct analytics, independent of category rules changing later.
**Cons:** More DB storage; update indexer and serializers.

### C. Add IPFS Metadata Schema Versioning
**Pros:** Simplifies `_fetch_ticket_metadata` and prevents fragile branching.
**Cons:** Requires updating writers and documenting version support.

### D. Split Indexer into Domain-specific Services
**Pros:** Easier to test/scale; reduces risk of single failure stopping all sync.
**Cons:** Operational complexity and extra orchestration.

### E. Consolidate Settings and Env Docs
**Pros:** Faster onboarding; fewer misconfigurations.
**Cons:** Time investment to standardize across deploy scripts, docs, and `.env.example`.

---

## Milestone Requirements Check (from `MILESTONE_REQUIREMENTS_ANALYSIS.md`)
Status categories used:
- **Verified**: I found evidence in code.
- **Likely**: Strong indicators, but not fully verified end-to-end.
- **Not Found / Pending**: No evidence in repo, or marked incomplete.

### 1. Ticket Categories System
**Status:** **Verified**
- Contract and backend: `TicketCategory` model + `event_categories` endpoint.
- Frontend: `CategorySection`, `CategorySelect`, `CategoryAllocation`.

### 2. Show All Purchased Tickets
**Status:** **Verified**
- `client/src/features/ticket/ui/ShowTicket.tsx` renders all tickets with QR cards.

### 3. Referral System
**Status:** **Verified (core); Provider selection pending**
- Contract: `referralData` in mint functions.
- Backend: referral creation in indexer.
- Frontend: referral storage + UI in `features/referral`.
- **Pending:** third-party provider selection/setup.

### 5. Event Place Deposit Parameter
**Status:** **Verified**
- Model: `event_deposit_size`.
- IPFS metadata includes deposit in `upload_place_meta_to_ipfs`.

### 6. Flexible Revenue Distribution
**Status:** **Likely Verified**
- Evidence of `DynamicRevenueSplitter` in backend indexer and contract tree.
- Did not re-open the solidity file in this pass; recommend quick confirmation review.

### 8. Lifetime Revenue Display
**Status:** **Verified (but with bug)**
- Endpoint exists in `events/views.py` and model field `total_revenue`.
- **Bug:** revenue computation ignores category discounts (see above).

### 9. UX Improvements
**Status:** **Likely Verified**
- ENS display, multi-ticket, past events hiding, etc. appear in codebase but not fully re-verified end-to-end in this pass.

### 10. Local Provider Share Display
**Status:** **Unclear**
- Only evidence: `default_share` in user model and serializer. No UI verification here.

### 11. Map Enhancements
**Status:** **Unclear**
- Not fully inspected in this pass; map components exist but require confirmation.

### 12. Thirdweb OneKey Issue
**Status:** **Not Found / Pending**
- TODO remains in `AuthProvider.tsx`.

### 13. Monitoring & Reliability
**Status:** **Partially Implemented**
- Tracer setup script exists, but alert configuration and Telegram webhook are not visible in repo.

### 14. Admin Dashboard - Verification Stats
**Status:** **Likely Verified**
- Endpoint and UI presence not fully inspected in this pass; needs confirmation.

### 15. Mimi Integration
**Status:** **Not Found / Pending**
- Milestone points to separate repo; no evidence here.

### 16. Search Functionality for Admin Lists
**Status:** **Not Verified in this pass**
- Not inspected end-to-end.

### 17. Testing & Deployment
**Status:** **Not Found / Pending**
- No evidence of completed E2E test suite in this repo.

### 18. Transfer LocalProvider Authorities to Master
**Status:** **Not Verified**
- No direct evidence found in this pass.

---

## Known TODOs / FIXMEs (from repo scan)
This list is not exhaustive, but highlights visible maintenance debt:
- `client/src/app/providers/authProvider/ui/AuthProvider.tsx` - Thirdweb signature screen TODO.
- `client/src/features/ticket/ui/Redeem.tsx` - error handling TODO.
- `client/src/features/event-form/hooks/useEventPersist.tsx` - cleanup TODO.
- `backend/cyber_valley/events/views.py` - file extension FIXME, ticket image TODO.
- `backend/cyber_valley/indexer/service/_sync.py` - try/catch FIXME, IntEnum TODO.
- `ethereum/contracts/CyberValleyEventManager.sol` - padding/IPFS TODOs.
- `ethereum/contracts/CyberValleyEventTicket.sol` - padding TODO.

---

**Contracts Review**

## Scope
Reviewed:
- `ethereum/contracts/CyberValleyEventManager.sol`
- `ethereum/contracts/CyberValleyEventTicket.sol`
- `ethereum/contracts/DynamicRevenueSplitter.sol`
- `ethereum/contracts/DateOverlapChecker.sol`

## Findings
1. **DateOverlapChecker full-bucket mask overflow**
Evidence: `DateOverlapChecker.sol` `daysRangeToMask` uses `(1 << (end - start + 1)) - 1`. For `start=0,end=255` this shifts by 256 and reverts.
Impact: Any range exactly 256 days in a single bucket will revert, breaking overlap checks and allocation.
Fix: Use a safe mask construction for 0..255, such as `type(uint256).max` when `end - start + 1 == 256`, or use a right-shifted full mask.

2. **Event update frees the wrong date range**
Evidence: `CyberValleyEventManager.sol` `updateEvent` calls `freeDateRange(eventPlaceId, startDate, ...)` after mutating `evt.eventPlaceId` and uses the new `eventPlaceId` and raw `startDate` param rather than the old stored range.
Impact: Old allocations are not freed. New allocations may overlap. This can permanently block date slots.
Fix: Capture old `eventPlaceId`, `startDate`, `daysAmount` before mutation, free old range, then allocate new range using the floored `evt.startDate`.

3. **Category creation lacks creator ownership check**
Evidence: `createCategory` only requires `VERIFIED_SHAMAN_ROLE` and does not check `events[eventId].creator == msg.sender`.
Impact: Any verified shaman can add categories to another shaman’s event (before approval).
Fix: Require event creator match for `createCategory` or explicitly allow only local provider for non-owner edits.

4. **`setEventManagerAddress` never sets `eventManagerAddress`**
Evidence: `CyberValleyEventTicket.sol` `setEventManagerAddress` grants role but does not assign the storage field.
Impact: `eventManagerAddress` remains zero, making public state misleading and any logic relying on it incorrect.
Fix: Add `eventManagerAddress = _eventManagerAddress;`.

5. **`eventRequestPrice` unused**
Evidence: `CyberValleyEventManager.sol` declares and sets `eventRequestPrice` but never reads it.
Impact: Dead state, confusion about pricing source, and unnecessary storage cost.
Fix: Remove or rewire to intended behavior (or document as deprecated).

6. **`updateEvent` can modify approved events**
Evidence: `updateEvent` has no status restriction.
Impact: Approved events can be changed, potentially violating business rules and confusing indexer clients.
Fix: Restrict updates to `Submitted` status or add a separate admin-controlled update path.

7. **Unbounded `customers` growth and duplicates**
Evidence: `evt.customers.push(msg.sender)` on each mint without uniqueness or cap.
Impact: Storage bloat, duplicates, and increased gas over time.
Fix: Replace with a mapping or remove if not used.

8. **`ticketPrices` is written but never read**
Evidence: `ticketPrices[eventId].push(price)` only.
Impact: Dead storage that increases gas costs.
Fix: Remove if unused or wire into refunds/analytics.

## Positive Notes
- Category quota validation is gas-aware and uses `totalCategoryQuota` for aggregate checks.
- Revenue split logic is fully encapsulated in `DynamicRevenueSplitter` with profile ownership checks.
- Non-transferable tickets are enforced via `transferFrom` override.

---

**Backend Review**

## Scope
Reviewed:
- `backend/cyber_valley/events/views.py`
- `backend/cyber_valley/events/serializers.py`
- `backend/cyber_valley/indexer/service/_sync.py`
- `backend/cyber_valley/health/views.py`
- `backend/cyber_valley/health_views.py`
- `backend/cyber_valley/web3_auth/views.py`
- `backend/cyber_valley/users/views.py`
- `backend/cyber_valley/notifications/views.py`
- `backend/cyber_valley/notifications/helpers.py`

## Findings
1. **Ticket verification endpoint lacks staff role enforcement**
Evidence: `events/views.py` `verify_ticket` only requires `IsAuthenticated`.
Impact: Any authenticated user can verify tickets (effectively redeem for others).
Fix: Enforce staff/master roles at the view or permission class.

2. **Nonce issuance does not check ticket ownership**
Evidence: `events/views.py` `ticket_nonce` issues a nonce for any `event_id`/`ticket_id` without ownership check.
Impact: A user can request a nonce for a ticket they don't own; combined with missing staff check, this is a critical security gap.
Fix: Require staff role for nonce, or validate ownership and intended redemption flow.

3. **Duplicate health check implementations**
Evidence: `health/views.py` and `health_views.py` both define `health_check`.
Impact: Maintenance confusion and potential drift; only one is wired in `urls.py`.
Fix: Remove `health_views.py` or clearly deprecate it.

4. **Debug logging in auth refresh**
Evidence: `web3_auth/views.py` prints `DEBUG {refresh.payload=}`.
Impact: Sensitive token payloads can leak in logs.
Fix: Remove debug print or gate behind DEBUG.

5. **Role checks inconsistent (role vs roles M2M)**
Evidence: `users/views.py` uses `request.user.role` in `verified_shamans`, while roles are tracked in M2M (`roles`).
Impact: If `role` field is not kept in sync with `roles`, access control can be incorrect.
Fix: Replace with `has_role(...)` consistently.

6. **Indexer writes `UserSocials` without validating payload**
Evidence: `_sync_ticket_minted` writes `socials["network"]`/`socials["value"]` directly.
Impact: Metadata shape changes can crash sync or create invalid socials.
Fix: Guard with `.get` and validate expected keys.

7. **Revenue metrics ignore category price**
Evidence: `_sync_ticket_minted` increments `event.total_revenue += event.ticket_price`.
Impact: Discounted categories inflate revenue metrics.
Fix: Use category discount when computing revenue or store price per ticket.

## Positive Notes
- Search endpoints implemented for events, places, staff, shamans, providers, notifications.
- Health check has proper 200/503 status and includes database + blockchain checks.
- Notification mirroring to Telegram is centralized via `post_save` signal.

---

**Client Review**

## Scope
Reviewed:
- `client/src/shared/api/apiClient.ts`
- `client/src/features/login/hooks/useLogin.tsx`
- `client/src/features/ticket/api/redeem.ts`
- `client/src/features/ticket/ui/Redeem.tsx`
- `client/src/features/ticket/ui/ShowTicket.tsx`
- `client/src/features/ticket/ui/CategoryAllocation.tsx`
- `client/src/features/purchase/api/purchase.tsx`
- `client/src/features/referral/lib/storage.ts`

## Findings
1. **Redeem flow doesn’t await async redemption**
Evidence: `Redeem.tsx` calls `redeem(account, value.rawValue)` without `await`.
Impact: Errors won’t be caught; UI may report success even if redeem fails.
Fix: `await redeem(...)` and handle async errors in the handler.

2. **Redeem polling runs every second**
Evidence: `useEventStatus` refetch interval = 1s; `ShowTicket` also polls per ticket.
Impact: High request volume; scales poorly for heavy usage.
Fix: Increase interval, or poll only when dialog open, or use server-sent events / batch status endpoint.

3. **Relative fetch in auth flow bypasses configured API host**
Evidence: `useLogin` uses `fetch("/api/auth/...")` rather than `apiClient` or `PUBLIC_API_HOST`.
Impact: Breaks when API is on a different host or needs `credentials: "include"`.
Fix: Use `apiClient` or build URLs from `PUBLIC_API_HOST` and include credentials.

4. **Excessive console logging in production paths**
Evidence: `useLogin`, `purchase`, `web3` helpers, manage-event flows log extensively.
Impact: Noisy console, potential leakage of sensitive data, performance cost on slow devices.
Fix: Gate logs behind a debug flag or strip in production build.

5. **Category allocation caps unlimited categories at 10**
Evidence: `CategoryAllocation` uses `maxAllowed = remainingQuota ?? 10`.
Impact: “Unlimited” categories still capped at 10 tickets.
Fix: Allow larger counts or make cap configurable.

6. **Order metadata currency uses USDC**
Evidence: `purchase.tsx` writes `currency: "USDC"` for order metadata.
Impact: Inconsistent with backend and contracts (USDT), causes reporting confusion.
Fix: Align metadata currency with actual token used.

7. **Error handling relies on alerts/confirm**
Evidence: `Redeem.tsx` uses `alert`/`confirm` and lacks structured error UI.
Impact: Poor UX and hard to localize/test.
Fix: Replace with modal/toast flows and proper error states.

## Positive Notes
- Category allocation UX is solid and already integrates discount logic.
- Referral flow is cleanly isolated and validates address format before storing.
- API client includes automatic refresh flow with shared promise to prevent stampedes.
