# Implementation Plan: Fix Bugs & Weak Decisions

Based on REVIEW.md analysis. **Please review and approve before implementation.**

---

## Phase 1: Critical Bugs (Security & Data Integrity)

### 1.1 Backend: Fix Lifetime Revenue Calculation (Category Discounts)
**Problem:** Indexer increments `event.total_revenue += event.ticket_price` regardless of category discounts, inflating revenue for discounted tickets.

**Files to modify:**
- `backend/cyber_valley/indexer/service/_sync.py` - `_sync_ticket_minted()`
- `backend/cyber_valley/events/models.py` - Add `price_paid` to Ticket model

**Proposed fix:**
1. Add `price_paid` field to Ticket model
2. Compute actual price from category discount in indexer
3. Use `price_paid` instead of `event.ticket_price` for revenue

**Decision needed:** Should we store `price_paid` per ticket or compute from category each time?

iclude price paid into ticketminted event

---

### 1.2 Backend: Fix `Event.website` Missing max_length
**Problem:** `CharField()` without `max_length` is invalid in Django.

**Files to modify:**
- `backend/cyber_valley/events/models.py`
- Create new migration

**Proposed fix:**
```python
website = models.URLField(max_length=2048, blank=True, null=True)
```

---

### 1.3 Backend: Fix Ticket Verification Security (Staff Role Enforcement)
**Problem:** `verify_ticket` endpoint only requires `IsAuthenticated`, any user can verify tickets.

**Files to modify:**
- `backend/cyber_valley/events/views.py` - `verify_ticket` view
- `backend/cyber_valley/events/permissions.py` (if exists) or add permission class

**Proposed fix:**
Add `@permission_classes([IsStaff | IsMaster])` or similar check.

---

### 1.4 Backend: Fix Nonce Issuance Security
**Problem:** `ticket_nonce` issues nonce for any ticket without ownership check.

**Files to modify:**
- `backend/cyber_valley/events/views.py` - `ticket_nonce` view

**Proposed fix:**
Either:
- Option A: Require staff role for nonce issuance
- Option B: Verify ticket ownership AND intended redemption flow

**Decision needed:** Which approach aligns with business flow? B

---

### 1.5 Backend: Remove Debug Logging in Auth Refresh
**Problem:** `print(f"DEBUG {refresh.payload=}")` leaks sensitive token data.

**Files to modify:**
- `backend/cyber_valley/web3_auth/views.py`

**Proposed fix:** Remove debug print or gate behind `DEBUG` setting.

---

## Phase 2: High Priority Bugs (Contract & Indexer)

### 2.1 Contract: Fix DateOverlapChecker Overflow
**Problem:** `(1 << (end - start + 1))` overflows when range is 256 days.

**Files to modify:**
- `ethereum/contracts/DateOverlapChecker.sol`

**Proposed fix:**
```solidity
if (end - start + 1 == 256) {
    mask = type(uint256).max;
} else {
    mask = (1 << (end - start + 1)) - 1;
}
```
instead forbid 256 days range with require
---

### 2.2 Contract: Fix Event Update Freeing Wrong Date Range
**Problem:** `updateEvent` frees new range instead of old range after mutation.

**Files to modify:**
- `ethereum/contracts/CyberValleyEventManager.sol`

**Proposed fix:**
Capture old values BEFORE mutation, free old range first, then allocate new.

---

### 2.3 Contract: Fix setEventManagerAddress Assignment
**Problem:** Function grants role but never sets `eventManagerAddress` storage.

**Files to modify:**
- `ethereum/contracts/CyberValleyEventTicket.sol`

**Proposed fix:**
```solidity
function setEventManagerAddress(address _eventManagerAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _grantRole(EVENT_MANAGER_ROLE, _eventManagerAddress);
    eventManagerAddress = _eventManagerAddress;  // ADD THIS
}
```

---

### 2.4 Contract: Add Category Creation Ownership Check
**Problem:** Any verified shaman can add categories to another's event.

**Files to modify:**
- `ethereum/contracts/CyberValleyEventManager.sol` - `createCategory`

**Proposed fix:**
Add check: `require(events[eventId].creator == msg.sender, "Not event owner")` or allow local provider override.

---

### 2.5 Indexer: Fix UserSocials Validation
**Problem:** Direct dict access `socials["network"]` crashes on malformed IPFS data.

**Files to modify:**
- `backend/cyber_valley/indexer/service/_sync.py`

**Proposed fix:**
```python
network = socials.get("network")
value = socials.get("value")
if network and value:
    UserSocials.objects.create(...)
```

---

### 2.6 Indexer: Fix IPFS File Extension Assert
**Problem:** `assert cover.filename.endswith(...)` causes 500 on extensionless uploads.

**Files to modify:**
- `backend/cyber_valley/events/views.py`

**Proposed fix:** Infer extension from MIME type or allow extensionless with safe default.

---

## Phase 3: Medium Priority (Client & UX)

### 3.1 Client: Fix Redeem Flow Async Handling
**Problem:** `redeem()` called without `await`, errors not caught.

**Files to modify:**
- `client/src/features/ticket/ui/Redeem.tsx`

**Proposed fix:** Add `await` and proper try/catch with error UI.

---

### 3.2 Client: Fix Relative Fetch in Auth Flow
**Problem:** `fetch("/api/auth/...")` bypasses `PUBLIC_API_HOST` config.

**Files to modify:**
- `client/src/features/login/hooks/useLogin.tsx`

**Proposed fix:** Use `apiClient` or construct URL from `PUBLIC_API_HOST`.

---

### 3.3 Client: Fix Excessive Console Logging
**Problem:** Production paths have verbose logging.

**Files to modify:**
- `client/src/features/login/hooks/useLogin.tsx`
- `client/src/features/purchase/api/purchase.tsx`
- Other identified files

**Proposed fix:** Gate logs behind `import.meta.env.DEV` check.

---

### 3.4 Client: Fix Category Allocation Unlimited Cap
**Problem:** Unlimited categories capped at 10.

**Files to modify:**
- `client/src/features/ticket/ui/CategoryAllocation.tsx`

**Proposed fix:** Use higher cap or make configurable when `remainingQuota` is null.

---

### 3.5 Client: Fix Order Metadata Currency (USDC vs USDT)
**Problem:** Metadata says USDC but contracts use USDT.

**Files to modify:**
- `client/src/features/purchase/api/purchase.tsx`

**Proposed fix:** Change `currency: "USDC"` to `currency: "USDT"`.

---

## Phase 4: Low Priority / Cleanup

### 4.1 Backend: Remove Duplicate Health Check
**Problem:** `health/views.py` and `health_views.py` both exist.

**Files to modify:**
- Delete `backend/cyber_valley/health_views.py` (verify `urls.py` uses `health/views.py`)

---

### 4.2 Backend: Fix Role Checks Consistency
**Problem:** `request.user.role` vs M2M `roles` inconsistency.

**Files to modify:**
- `backend/cyber_valley/users/views.py`

**Proposed fix:** Use `has_role()` method consistently.

---

### 4.3 Client: Fix Redeem Error Handling (alerts → UI)
**Problem:** Uses `alert()`/`confirm()` instead of proper UI.

**Files to modify:**
- `client/src/features/ticket/ui/Redeem.tsx`

**Proposed fix:** Replace with toast/modal components.

---

### 4.4 Client: Reduce Polling Frequency
**Problem:** `useEventStatus` polls every second, `ShowTicket` polls per ticket.

**Files to modify:**
- `client/src/features/ticket/ui/ShowTicket.tsx`
- Related hooks

**Proposed fix:** 
- Increase interval to 5-10 seconds
- Or poll only when dialog is open
- Or implement debouncing

---

## Phase 5: Money Unit Normalization (Refactoring)

### 5.1 Standardize Money Fields
**Problem:** `PositiveSmallIntegerField` for `ticket_price` may overflow.

**Files to modify:**
- `backend/cyber_valley/events/models.py`
- Migrations for field type changes
- Serializers for conversion

**Proposed fix:**
Use `PositiveBigIntegerField` storing smallest units (6 decimals for USDT).

**Decision needed:** Is this critical for current milestone or can be deferred?

---

## Phase 6: Contract Dead Code Removal

### 6.1 Remove/Document Unused State
**Files to review:**
- `ethereum/contracts/CyberValleyEventManager.sol`
  - `eventRequestPrice` (unused)
  - `ticketPrices` mapping (written but never read)
  - `customers` array (unbounded growth, duplicates)

**Decision needed:** 
- Are these intentionally kept for future use?
- Can we safely remove to save gas?

---

## Summary Table

| Phase | Issue | Severity | Effort | Decision Required |
|-------|-------|----------|--------|-------------------|
| 1.1 | Revenue calculation | Critical | Medium | Yes (storage vs compute) |
| 1.2 | website max_length | Critical | Low | No |
| 1.3 | Verification security | Critical | Low | No |
| 1.4 | Nonce security | Critical | Low | Yes (approach) |
| 1.5 | Debug logging | Critical | Low | No |
| 2.1 | Date mask overflow | High | Low | No |
| 2.2 | Event update dates | High | Medium | No |
| 2.3 | setEventManagerAddress | High | Low | No |
| 2.4 | Category ownership | High | Low | Yes (local provider override?) |
| 2.5 | UserSocials validation | High | Low | No |
| 2.6 | IPFS extension assert | High | Low | No |
| 3.1-3.5 | Client fixes | Medium | Medium | No |
| 4.1-4.4 | Cleanup | Low | Low | No |
| 5.1 | Money normalization | Medium | High | Yes (defer?) |
| 6.1 | Dead code | Low | Low | Yes (keep or remove?) |

---

## Questions for You

1. **Revenue calculation (1.1):** Store `price_paid` per ticket or compute from category each time?
2. **Nonce issuance (1.4):** Should nonce endpoint require staff role, or check ticket ownership?
3. **Category creation (2.4):** Should local provider be able to add categories to any event, or only event creator?
4. **Money normalization (5.1):** Critical for this milestone or defer?
5. **Contract dead code (6.1):** Remove unused state variables or document as future-use?
6. **Priority:** Should I start with Phase 1 (critical backend bugs) while you decide on others?

---

**Please review and let me know:**
- Which phases to proceed with
- Your answers to the questions above
- Any items to skip or defer
