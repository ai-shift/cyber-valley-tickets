# Cyber Valley Tickets - Milestone Requirements Analysis

## Time Allocation Summary

**Total Hours: 98 hours**

---

## 1. Ticket Categories System (12 hours)

### Requirements
- Create ticket categories with:
  - Category name
  - Discount percentage (optional)
  - Quota/limit (optional - if not set, limited by total event capacity)
- Examples: families, women, locals
- Permissions:
  - Shaman (VERIFIED_SHAMAN) can create categories
  - Local Provider (LOCAL_PROVIDER) can edit categories
- Only one category can have unlimited quota
- Categories can **NOT** be created/modified after event is approved

### Implementation Tasks

#### Smart Contract Modifications (5h)
- [ ] Add `TicketCategory` struct to EventManager
- [ ] Implement `createCategory` function with permission checks
- [ ] Implement `updateCategory` function
- [ ] Modify `mintTicket` to support categories and discounts

#### Contract Tests (3.5h)
- [ ] Test category creation/updates
- [ ] Test quota enforcement
- [ ] Test discount calculation
- [ ] Test edge cases (unlimited quota, multiple buyers)
- [ ] Test permission checks (VERIFIED_SHAMAN, LOCAL_PROVIDER)

#### Backend Indexer (2h)
- [ ] Index `TicketCategoryCreated` events
- [ ] Index `TicketCategoryUpdated` events
- [ ] Create API endpoints for listing categories

#### Frontend UI (2h)
- [ ] Category selection dropdown on ticket purchase page
- [ ] Category management interface for event creators
- [ ] Display discount percentage on UI
- [ ] Show quota remaining for each category

---

## 2. Show All Purchased Tickets for Event (2 hours)

### Requirements
- Add button to show list of ALL tickets purchased for an event
- Display with QR codes for redemption
- Replace single ticket view with multi-ticket list view

### Implementation Tasks

#### Frontend UI (1.5h)
- [ ] Multi-ticket display component with grid layout
- [ ] QR code generation for each ticket
- [ ] "Show All Tickets" button on event page
- [ ] Mobile-responsive ticket card layout

### Questions

1. **Multiple tickets approve strategy**
    - Approve each individually
    - Approve all of them with one QR code (+1 h)
    - Select tickets to be approved (+2 h)

---

## 3. Referral System (9 hours)

### Requirements
- Track referrals for ticket purchases
- Add referral address/code to URL
- **Client prefers:** Use ready-made solution instead of building from scratch

### Implementation Tasks

#### Smart Contract (1h)
- [ ] Add `referralData` parameter to `mintTicket` function
- [ ] Emit `TicketMintedWithReferral` event
- [ ] Write integration tests for referral tracking
- [ ] Test edge cases (empty referral data, malformed data)

#### Backend Tracking (1h)
- [ ] Create event listener for `TicketMintedWithReferral`
- [ ] Add referral database schema (referrer, referee, event, timestamp)

#### Frontend Integration (3h)
- [ ] Parse referral code from URL parameter (`?ref=address`)
- [ ] Store referral code in local storage
- [ ] Pass referral data to `mintTicket` transaction
- [ ] Design UI to accept referral code in the field
- [ ] Program UI to accept referral code

#### Select 3rd party provider for referrals and setup it (4h)

### External Solutions Integration

**Thirdweb Engine**
- **What:** Managed backend for Web3 apps with built-in referrals
- **How:** Pass Thirdweb campaign ID in `referralData`
- **Rewards:** Thirdweb handles reward distribution via their backend
- **Cost:** Free tier available, paid for advanced features
- **Link:** https://thirdweb.com/engine

**Layer3 Quests**
- **What:** Quest platform with referral tracking
- **How:** Users complete "buy ticket" quest with referral code
- **Rewards:** Layer3 distributes rewards (tokens, NFTs)
- **Cost:** Free for basic integration
- **Link:** https://layer3.xyz

**ReferralCandy / Tapcart**
- **What:** Traditional Web2 referral platforms with Web3 hooks
- **How:** Track purchases via webhooks listening to events
- **Rewards:** Fiat or crypto cashback
- **Cost:** Monthly subscription

---

## 5. Event Place Deposit Parameter (4 hours)

### Requirements
- Add deposit parameter to event places
- Deposit used when creating event at that place
- Replaces global event request price

### Implementation Tasks

#### Smart Contract (2h)
- [ ] Add `customEventDeposit` field to EventPlace struct
- [ ] Add `minEventDeposit` global variable
- [ ] Update `submitEventPlaceRequest` to accept custom deposit
- [ ] Modify `submitEventRequest` to use custom deposit if set, else global price
- [ ] Add validation: custom deposit >= minEventDeposit

#### Backend API (1h)
- [ ] Update EventPlace model schema with deposit field
- [ ] Index deposit field from blockchain events
- [ ] Update API serializers to include deposit

#### Frontend UI (1h)
- [ ] Add deposit input field to event place creation form
- [ ] Display deposit amount on event place details
- [ ] Show deposit amount when creating event at a place

---

## 6. Flexible Revenue Distribution System (9 hours)

### Requirements
- **Master and DevTeam:** Hardcoded percentages (fixed shares) - 30% Master, 10% DevTeam
- **Remaining funds:** Flexible distribution to multiple recipients
- **Use case:** After Master (30%) and DevTeam (10%) receive their shares, the remaining 60% can be distributed flexibly to:
  - Local provider (default)
  - Multiple partners (marketing, venue, sponsors)
  - Dynamic allocation per event or campaign
  - DAO treasury or community pools

### Architecture: Fully Encapsulated Distribution Contract

**Key Design Principle:** EventManager knows NOTHING about revenue distribution details. It simply transfers all funds to the DynamicRevenueSplitter contract, which handles all distribution logic internally (including fixed Master/DevTeam shares).

**Benefits:**
- EventManager remains simple and focused on event management
- All revenue logic centralized in one upgradeable contract
- No need to modify EventManager when changing distribution rules
- Clear separation of concerns

### Implementation Tasks

#### DynamicRevenueSplitter Contract (5h)
- [ ] Create contract with immutable master and devTeam addresses
- [ ] Define fixed share constants (30%, 10%, 60%)
- [ ] Implement Distribution struct and profile mappings
- [ ] Implement `createDistributionProfile` function
- [ ] Implement `updateDistributionProfile` function
- [ ] Implement `setDefaultProfile` and `setEventProfile` functions
- [ ] Implement `distributeRevenue` main function (pull funds, split, distribute)
- [ ] Implement `_distributeFlexible` internal function
- [ ] Add profile validation (shares sum to 10000)

#### Integration with EventManager (1h)
- [ ] Add `revenueSplitter` state variable to EventManager
- [ ] Implement `setRevenueSplitter` function (MASTER_ROLE only)
- [ ] Update `distributeEventFunds` to approve and call splitter
- [ ] Remove old distribution logic from EventManager

#### Testing (3h)
- [ ] Test profile creation and updates
- [ ] Test distribution calculations (30%, 10%, 60% splits)
- [ ] Test event-specific profiles vs default profile
- [ ] Test edge cases (zero amounts, single recipient, many recipients)
- [ ] Integration tests with EventManager

---

### Smart Contract: DynamicRevenueSplitter

**State Variables:**
```solidity
// Fixed recipients (immutable)
address public immutable master;
address public immutable devTeam;

// Fixed shares (constants) - basis points where 10000 = 100%
uint256 public constant MASTER_SHARE = 3000;   // 30%
uint256 public constant DEVTEAM_SHARE = 1000;  // 10%
uint256 public constant FLEXIBLE_SHARE = 6000; // 60%

// Distribution profiles for flexible portion
mapping(uint256 => Distribution) public distributions;
mapping(uint256 => uint256) public eventProfiles;  // eventId => profileId
uint256 public defaultProfileId;
```

**Key Functions:**

1. **`constructor(address _usdt, address _master, address _devTeam, address _admin)`**
   - Sets immutable master and devTeam addresses
   - Grants admin role

2. **`createDistributionProfile(address[] recipients, uint256[] shares) → uint256 profileId`**
   - Admin-only
   - Creates profile for flexible 60% portion
   - Shares must sum to 10000 (100% of flexible portion)
   - Returns new profile ID

3. **`updateDistributionProfile(uint256 profileId, address[] recipients, uint256[] shares)`**
   - Admin-only
   - Updates existing profile
   - Validates shares sum to 10000

4. **`setDefaultProfile(uint256 profileId)`**
   - Admin-only
   - Sets fallback profile when no event-specific profile exists

5. **`setEventProfile(uint256 eventId, uint256 profileId)`**
   - Admin-only
   - Assigns custom profile to specific event

6. **`distributeRevenue(uint256 amount, uint256 eventId)`**
   - Called by EventManager with total revenue
   - Logic:
     1. Pull all USDT from EventManager
     2. Calculate: masterAmount (30%), devTeamAmount (10%), flexibleAmount (60%)
     3. Transfer fixed shares to master and devTeam
     4. Look up profile (event-specific or default)
     5. Distribute flexible portion according to profile

**Core Distribution Flow:**

```
100 USDT revenue → distributeRevenue(100, eventId: 42)
├─ Master: 30 USDT (30% fixed)
├─ DevTeam: 10 USDT (10% fixed)
└─ Flexible: 60 USDT (60% split by profile)
   ├─ If profile #1 = [provider: 5000, marketing: 3000, venue: 2000]
   ├─ Provider: 30 USDT (50% of 60)
   ├─ Marketing: 18 USDT (30% of 60)
   └─ Venue: 12 USDT (20% of 60)
```

---

## 8. Lifetime Revenue Display (3 hours)

### Requirements
- Add "Lifetime Revenue" button on Events screen (top right)
- Show total earnings i.e. amount of transferred USDTs for tickets

### Implementation Tasks

#### Backend Implementation (2h)
- [ ] Add `total_revenue` field to Event model (DecimalField)
- [ ] Update indexer to increment revenue on `TicketMinted` events
- [ ] Create `lifetime_revenue` API endpoint

#### Frontend UI (2h)
- [ ] Design UI
- [ ] Create LifetimeRevenueButton component
- [ ] Add React Query hook for fetching revenue

### Implementation

**Architecture:**
- Backend listens to `TicketMinted` events (already implemented)
- Extract `eventId` and look up `ticketPrice` from indexed event data
- Store aggregated revenue per event in database
- Provide API endpoints for role-based revenue queries

### Questions

1. **Should we count deposits for event requests?**

---

## 9. UX Improvements (15 hours total)

### 9.1 Event Created → Show Event Page (1 hour)

**Current:** Form closes, unclear what happened
**Required:** Navigate to newly created event details

### 9.2 Ticket Bought → Stay on Event Page (2 hours)

**Current:** Unclear navigation after purchase
**Required:** Stay on event page, update state to show ticket

### 9.3 Hide Past Events (2 hours)

**Required:** Don't show events past their end date to regular users

### 9.4 ENS/Instagram Display (3 hours)

**Required:** Show Instagram or ENS instead of Ethereum address

#### ENS Resolution Integration (2h)
- [ ] Implement ENS lookup service (using ethers.js)
- [ ] Add caching layer for ENS lookups
- [ ] Handle reverse resolution (address → ENS name)
- [ ] Add fallback to address if no ENS found

#### UI Integration (1h)
- [ ] Create AddressDisplay component (ENS > address)
- [ ] Update all address displays across components
- [ ] Add tooltip showing full address on hover

### 9.5 Telegram Verification Success (1 hour)

**Required:** Show success message after Telegram account connected

### 9.6 Login on Event Creation Form (2 hours)

**Required:** Show event form when not logged in, "Login to Create" button instead of Submit

- [ ] Check authentication state in event creation form
- [ ] Replace "Submit" button with "Login to Create" when not authenticated
- [ ] Show login modal on button click
- [ ] Redirect back to form after login

### 9.7 New Button → Popover (1 hours)

**Required:** "New" button opens popover with "New Event" and "New Event Space" options

- [ ] Create popover menu component
- [ ] Add "New Event" and "New Event Space" options
- [ ] Position popover correctly (below button)

### 9.8 Signing with Expiration (3 hours)

**Required:** Reduce re-signing frequency by extending token lifetime

#### Backend (2h)
- [ ] Extend JWT token lifetime configuration
- [ ] Add expiration timestamp to signature payload
- [ ] Implement expiration validation in auth middleware
- [ ] Add token refresh endpoint

#### Frontend (1)
- [ ] Store signature and expiration in local storage
- [ ] Check expiration before API calls
- [ ] Auto-refresh token when near expiration
- [ ] Clear stored signature on logout

### 9.9 Notification Duplication (1h)

- [ ] Mirror all notifications on the platform to telegram

---

## 10. Local Provider Share Display (2 hours)

### Requirements
- Show share percentage and socials in local provider list (for master)
- Show socials for shaman

### Implementation Tasks

#### Backend API (1h)
- [ ] Add share percentage to local provider list endpoint
- [ ] Include social media fields in API response
- [ ] Add filtering/sorting by share percentage

#### Frontend UI (1h)
- [ ] Update provider list table to show share percentage column
- [ ] Display social media links (Instagram, Telegram, Discord)
- [ ] Add visual indicators for verified accounts

---

## 11. Map Enhancements (7 hours)

### 11.1 Always-Visible Events Layer (1 hour)

**Required:** Events layer cannot be hidden, checkbox always checked and disabled

#### Tasks
- [ ] Set events layer checkbox to always checked
- [ ] Disable checkbox interaction
- [ ] Add visual indicator that layer is always visible

### 11.2 Feature Attributes Display (4 hour)

**Required:** Show all attributes when clicking on map features

#### Tasks
- [ ] Implement backend to sync attributes
- [ ] Implement popup component for feature details
- [ ] Display all feature properties from GeoJSON
- [ ] Format attributes for readability
- [ ] Add close button to popup

### 11.3 Yandex-Style Map Pin (1 hour)

**Required:** Use Yandex-style location pin instead of "E" icon

#### Tasks
- [ ] Create or import Yandex-style pin icon/SVG
- [ ] Replace current "E" marker with new pin
- [ ] Ensure pin works with different marker states (selected, hover)
- [ ] Update pin color scheme to match design

### 11.4 Layer List from Dima

**Status:** Waiting for layer specifications

### 11.5 Persist Rendered Map Between Navigations (1 hour)

#### Tasks
- [ ] Store map state (zoom, center, layers) in a store
- [ ] Restore map state on navigation back to map page
- [ ] Prevent unnecessary re-renders
- [ ] Add reset button to clear saved state

---

## 12. Thirdweb OneKey Issue (2h)

#### Tasks
- [ ] Reproduce issue
- [ ] Finds what's wrong

---

## 13. Monitoring & Reliability (5 hours)

### 13.1 Uptime Monitoring (4 hours)

**Required:** Monitor service availability, send alerts on failure

#### Uptime Kuma Setup (2h)
- [ ] Install Uptime Kuma
- [ ] Add service endpoints (backend API, frontend, indexer)
- [ ] Configure monitoring intervals

#### Alert Configuration (2h)
- [ ] Set up Telegram webhook for alerts
- [ ] Configure notification rules (failure thresholds)
- [ ] Test alert delivery
- [ ] Add status page URL to documentation

### 13.2 Hourly Service Health Check (1 hour)

**Required:** Check services every hour, send Telegram alert on failure

#### Health Endpoint Implementation (0.5h)
- [ ] Create `/api/health/` endpoint in Django
- [ ] Add service status checks (database, blockchain connection)
- [ ] Return structured health status JSON

#### Monitoring Integration (0.5h)
- [ ] Configure Uptime Kuma to check `/api/health/` hourly
- [ ] Set alert threshold to status != "alive"
- [ ] Test automated alerts

---

## 14. Admin Dashboard - Verification Stats (6 hours)

### Requirements
- Show verification statistics for Master and Local Provider
- Current week vs previous week comparison
- Metrics: verified count, pending count, average verification time

### Implementation Tasks

#### Backend Analytics (3h)
- [ ] Create weekly stats calculation endpoint
- [ ] Calculate average verification time

#### Frontend Dashboard (3h)
- [ ] Design UI
- [ ] Create verification stats table component

---

## 15. Mimi Integration (8 hours)

- Use mimi for shaman verification and socials

mimi implemented in Go and is a completely different service with it's own infrastructure and Telegram does not support multiple bots listening for the events in the same time on the single bot token.

- Migrate mimi from long polling to webhooks
- Implement webhook redirection to tickets service
- Migrate tickets from long polling to webhooks

---

## 16. Search Functionality for Admin Lists (6 hours)

### Requirements
- Add search bars to all lists visible to Local Provider and Master roles
- Search should be available for events list (all users)
- Search should automatically check main fields of searched entity
- Debounced input to avoid excessive API calls (300ms delay)

### Implementation Tasks

#### Backend Search Implementation (2.5h)
- [ ] Add search query parameters to 7 list endpoints
- [ ] Implement multi-field search using Django Q objects
- [ ] Add search for Events list (title, place name, creator)
- [ ] Add search for Event Places list (name, provider)
- [ ] Add search for Verified Shamans list (address, Instagram, Telegram)
- [ ] Add search for Local Providers list (address, Instagram, Telegram)
- [ ] Add search for Staff list (address, Instagram, Telegram)
- [ ] Add search for Notifications list (title, body)
- [ ] Test search across all entity types

#### Frontend Search UI (3.5h)
- [ ] Create reusable SearchBar component with debouncing (300ms)
- [ ] Integrate SearchBar into Events list
- [ ] Integrate SearchBar into Event Places list
- [ ] Integrate SearchBar into Verified Shamans list
- [ ] Integrate SearchBar into Local Providers list
- [ ] Integrate SearchBar into Staff list
- [ ] Integrate SearchBar into Notifications list
- [ ] Add clear search button (X icon)
- [ ] Manage search state with React Query
- [ ] Add loading indicator during search

---

## 17. Testing & Deployment (8 hours)

### End-to-End Testing (4 hours)
- [ ] Test critical user flows (event creation, ticket purchase, verification)
- [ ] Test contract interactions (categories, referrals, revenue distribution)
- [ ] Verify revenue distribution calculations
- [ ] Test search functionality across all lists
- [ ] Validate role-based access controls

### Bug Fixes & Polish (3 hours)
- [ ] Fix issues found during testing
- [ ] Handle edge cases
- [ ] Performance optimization
- [ ] UI/UX polish

### Documentation & Deployment (1 hour)
- [ ] Update deployment scripts
- [ ] Write configuration documentation
- [ ] Update README with new features
