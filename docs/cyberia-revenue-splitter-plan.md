# Cyberia Revenue Splitter Plan (Confirmed From HQ Chat)

Date: 2026-02-04
Source of truth: `aishift - HQ` → `cyberia` topic (text + chalkboard photo + voice).

## Confirmed Requirements

### Revenue Top-Level Split
Based on the chalkboard scheme + voice note:

- **Cyberia DAO LLC**: **10%** (fixed)
- **CVE PT PMA**: **5%** (fixed)
- **Fixed 15%** total: **10% Cyberia DAO LLC + 5% CVE PT PMA**
- **Local provider share**: set by master at provider creation (default **5%** in examples)
- **Remaining 80%**: routed to a **dynamic splitter contract**

The **80%** is explicitly confirmed in the voice note:

> “80% оставшиеся, должны идти распределяться в контракт… и как раз доля шамана должна выставляться там, и оттуда браться.”

### Dynamic Splitter Behavior (Admin-Managed)
- The **80% pool** is distributed by a **contract** whose configuration is **admin-controlled**.
- **Shaman share** must be **configured in admin** and **read from the splitter contract** (not hardcoded elsewhere).

### Local Provider Default Share
- **Not hardcoded**.
- Comes from the **value set by master when creating localhost**.
  - Source: Michael’s reply in the cyberia topic.

### Distribution Profile Ownership
- Local providers pick the distribution profile when approving an event.
- The profile must be **owned by the local provider** (already enforced on-chain).

---

## Current Code Audit Snapshot

### Contracts
- `ethereum/contracts/DynamicRevenueSplitter.sol`
  - Currently fixed: 10% (CyberiaDAO) + 5% (CVE PT PMA).
  - Flexible share: **85%** (needs to become **80%**).
  - No RiDA 5% recipient yet.
- `ethereum/contracts/CyberValleyEventManager.sol`
  - Routes full event revenue to the splitter on close.
  - Local provider selects profile on event approval and must own it.

### Backend
- `DistributionProfile` model is synced from on-chain events.
- `CyberValleyUser.default_share` exists and will be **synced from on-chain events**.

### Frontend
- Distribution profile creation copy says **“85% flexible revenue”** (needs to be **80%**).
- Local provider form has “Share” input but **does not persist** it.
- Local provider list already displays `default_share` if set.

---

## Implementation Plan (Aligned to Confirmed Requirements)

### 1) Contract updates (hard requirements)
- Fixed shares:
  - `CyberiaDAO = 10%`
  - `CVE PT PMA = 5%`
- Local provider share:
  - Set on provider creation by master (e.g., **5%**)
  - Paid directly to provider before flexible distribution
- Flexible share:
  - `Flexible = 100% - 15% - providerShare` (e.g., **80%** when providerShare=5%)

### 2) Admin-controlled splitter settings
- Provide admin flow to **set the default profile** and keep it up to date.
- Ensure **shaman share** is **only defined in the splitter profile** (admin side), not hardcoded in frontend or backend.

### 3) Local provider default share (from master)
- When master creates a local provider, **set the default share on-chain** via the contract method.
- The splitter **enforces** the minimum share for any distribution profile owned by that local provider.
- Backend `default_share` is **synced from the splitter event** (source of truth: chain).

### 4) Frontend updates
- Update distribution profile copy to **80% flexible** (assuming providerShare=5%).
- Wire “Share with Local provider” input to `grantLocalProvider(address, shareBps)` so it is stored on-chain.
- Keep list showing `default_share` (already done).

### 5) Backend sync changes
- Remove the API endpoint for updating default share.
- Update indexer to sync `LocalProviderDefaultShareSet` event into `default_share`.
- Update OpenAPI schema and client types.

### 6) Indexer / Sync
- No indexer changes required unless new contract events are added.

### 7) Tests
- Update contract tests for new fixed shares (10/5/5 + 80).
- Add indexer test for default share sync (if needed).

---

## Open Questions (None)
All requirements above are confirmed from HQ chat and are the source of truth.

---

## Test Timeout Root Cause
- **Symptom:** `CyberValleyEventTicket tokenURI` test timed out.
- **Cause:** the test used an **arrow function**, so `this.timeout(...)` was **not applied**. Mocha kept the **default 2000ms**, and the test took longer (IPFS/data URI work).
- **Fix:** switch to `function () { this.timeout(120000); ... }` so the timeout is actually set.
- **Result:** `make -C ethereum tests` now completes in ~13s with all tests green.

---

If you want me to implement now, I can proceed file-by-file.
