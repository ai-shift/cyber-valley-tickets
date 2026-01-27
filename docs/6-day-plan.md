# 6-Day Task Plan for Cyber Valley Tickets

## 🎯 Executive Summary

**Timeline:** January 26 - January 31, 2026 (6 days)  
**Total Hours:** 48 hours target  
**Tasks:** 33 tasks (7 GREEN 🔴 critical, 7 GREEN strategy, 23 BROWN routine)
**Total Fuel Cost:** 86 (avg 2.6 per task)

### Critical Issue from Private Chat
**Issue:** Incorrect Google Maps API key causing rendering failures.  
**Key Provided:** `AIzaSyDWa-YYoaiEHEZ2Qg9pnN2Zf1HP4oGP12s`  
**Required Action:** Verify, replace key, and confirm map/layers on `cyberia.my`

---

## 📅 Day 1 (Jan 26): Ticket Categories - Smart Contract Foundation (8h)

**Assignee:** @naqerl

### Tasks:
- [x] Review existing EventManager codebase and Category requirements
- [ ] Implement `createCategory` function with permission checks
- [ ] Implement `updateCategory` function
- [ ] Modify `mintTicket` to support categories and quotas
- [ ] Write unit tests for create/updateCategory

### Acceptance Criteria:
- `createCategory` enforces one unlimited quota max
- Permission checks: VERIFIED_SHAMAN & LOCAL_PROVIDER only
- `mintTicket` accepts categoryId and applies quota/discount logic

---

## 📅 Day 2 (Jan 27): Ticket Categories - Tests & Backend (8h)

**Assignee:** @naqerl

### Tasks:
- [ ] Complete quota enforcement tests
- [ ] Complete discount calculation tests
- [ ] Contract tests permission checks
- [ ] Index `TicketCategoryCreated` events
- [ ] Index `TicketCategoryUpdated` events
- [ ] Create API endpoints for listing categories

### Acceptance Criteria:
- API returns category details (id, name, discount, quota_sold, quota_total)
- Events indexed from blockchain to database
- All edge cases covered (unlimited, multiple buyers, 100% discount)

---

## 📅 Day 3 (Jan 28): Ticket Categories - Frontend & Verification (8h)

**Assignee:** @redmoor

### Tasks:
- [ ] Implement category selection dropdown
- [ ] Display discount percentage in UI
- [ ] Show quota remaining in UI
- [ ] Deploy contracts and configure frontend

### Acceptance Criteria:
- Users can select ticket category at purchase
- Discount badges displayed visibly
- Quota counters shown (e.g., "45/50 remaining")
- E2E flow verified on testnet

---

## Day 4 (Jan 29): Referral System - Core & Research (8h)

**Assignee:** @naqerl, @redmoor (frontend)

### Tasks:
- [ ] Add `referralData` parameter to `mintTicket` function
- [ ] Emit `TicketMintedWithReferral` event
- [ ] Create event listener for referral events
- [ ] Parse referral code from URL parameter
- [ ] Store referral code in local storage
- [ ] Research 3rd party referral providers

### Acceptance Criteria:
- Contract emits referral events
- Backend stores referrer, referee, event, timestamp
- Frontend parses `?ref=address` from URLs
- Research doc: pros/cons of Thirdweb, Layer3, ReferralCandy

---

## Day 5 (Jan 30): Referral System, Map Fix & UX Wins (8h)

**Assignees:** @naqerl (backend/contracts), @redmoor (frontend)

### Tasks:
- [ ] Pass referral data to mintTicket transaction
- [ ] Add UI field for referral code entry
- [ ] UX: Event Created → Show Event Page (1h)
- [ ] UX: Ticket Bought → Stay on Event Page (2h)
- [ ] 🔴 **CRITICAL MAP FIX**: Verify and replace API key (1h)
- [ ] Map Fix Verification on cyberia.my

### Acceptance Criteria:
- Referral data flows from localStorage → wallet → contract
- After event creation, redirect to details page
- After ticket purchase, stay on page and update state
- **Map fix**: Replace invalid key, verify rendering on `cyberia.my`

---

## Day 6 (Jan 31): Map Full Fix & Remaining UX (8h)

**Assignees:** @naqerl, @redmoor

### Tasks:
- [ ] 🔴 Finalize 3rd party provider selection
- [ ] 🔴 Confirm map fix with full deployment
- [ ] 🔴 UX: Hide Past Events
- [ ] UX: New Button → Popover
- [ ] UX: Telegram Verification Success
- [ ] Buffer for debugging and fixes

### Acceptance Criteria:
- Provider selected from Day 4 research
- Map fix deployed to production, all layers rendering
- Event list excludes past events (`end_date < now()`)
- "New" button shows popover menu
- Success banner displays after Telegram account link

---

## 🚨 RED Tasks (Critical/Urgent)

| Task | Fuel | Day | Owner |
|------|------|-----|-------|
| 🔴 CRITICAL MAP FIX: Verify and replace API key | ⛽⛽⛽⛽⛽ | Jan 30 | @naqerl |
| 🔴 Map Fix Verification on cyberia.my | ⛽⛽ | Jan 30 | @naqerl |
| 🔴 Confirm map fix with full deployment | ⛽⛽ | Jan 31 | @naqerl |

---

## 🟢 GREEN Tasks (Strategic/Proactive)

| Task | Fuel | Day | Owner |
|------|------|-----|-------|
| Implement createCategory with permission checks | ⛽⛽⛽⛽ | Jan 26 | @naqerl |
| Implement updateCategory function | ⛽⛽⛽⛽ | Jan 26 | @naqerl |
| Modify mintTicket to support categories | ⛽⛽⛽⛽⛽ | Jan 26 | @naqerl |
| Add referralData to mintTicket | ⛽⛽⛽ | Jan 29 | @naqerl |
| Emit TicketMintedWithReferral event | ⛽⛽ | Jan 29 | @naqerl |
| Research 3rd party referral providers | ⛽⛽⛽⛽ | Jan 30 | @naqerl |
| Finalize 3rd party provider selection | ⛽⛽⛽ | Jan 31 | @naqerl |

---

## 🟤 BROWN Tasks (Routine/Maintenance)

23 tasks covering:
- Unit tests and contract tests
- Backend indexing and API endpoints
- Frontend UI components
- UX improvements
- Debugging buffer

See detailed breakdown in database view above.

---

## 📊 Statistics

- **Total Tasks:** 33
- **Categories:** 7 🔴 RED | 7 🟢 GREEN | 23 🟤 BROWN
- **Total Fuel Cost:** 86
- **Average Fuel Cost:** 2.6
- **Projected Hours:** 48 hours (6 days × 8h)

---

## 🎉 Deliverables Summary

1. ✅ **Ticket Categories System** - Fully implemented on contract, indexed, and in UI
2. ✅ **Referral System** - Smart contract and backend ready, frontend UI added, provider approach defined
3. ✅ **Google Maps Fix** - API key issue resolved, full rendering confirmed
4. ✅ **UX Enhancements** - 5-6 wins delivered (navigation, visibility, notifications)
5. ✅ **Code Quality** - Core features covered by unit and contract tests

---

## 📌 Notes

- Google Maps API key `AIzaSyDWa-YYoaiEHEZ2Qg9pnN2Zf1HP4oGP12s` must be validated in Google Cloud Console
- Verify API key domains/IP restrictions include `cyberia.my` and development environments
- Test map and all layers after key deployment
- E2E testing scheduled for buffer time on Day 6
- All tasks marked as `is_monkey_readable = 1` (clear, actionable descriptions)
