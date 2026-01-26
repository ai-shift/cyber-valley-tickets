# Cyber Valley Tickets - Milestone Requirements Analysis

## Time Allocation Summary

**Total Hours: 104 hours**

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
- [ ] @naqerl Add `TicketCategory` struct to EventManager
- [ ] @naqerl Implement `createCategory` function with permission checks
- [ ] @naqerl Implement `updateCategory` function
- [ ] @naqerl Modify `mintTicket` to support categories and discounts

#### Contract Tests (3.5h)
- [ ] @naqerl Test category creation/updates
- [ ] @naqerl Test quota enforcement
- [ ] @naqerl Test discount calculation
- [ ] @naqerl Test edge cases (unlimited quota, multiple buyers)
- [ ] @naqerl Test permission checks (VERIFIED_SHAMAN, LOCAL_PROVIDER)

#### Backend Indexer (2h)
- [ ] @naqerl Index `TicketCategoryCreated` events
- [ ] @naqerl Index `TicketCategoryUpdated` events
- [ ] @naqerl Create API endpoints for listing categories

#### Frontend UI (2h)
- [ ] @redmoor Category selection dropdown on ticket purchase page
- [ ] @redmoor Category management interface for event creators
- [ ] @redmoor Display discount percentage on UI
- [ ] @redmoor Show quota remaining for each category

---

## 2. Show All Purchased Tickets for Event (2 hours)

### Requirements
- Add button to show list of ALL tickets purchased for an event
- Display with QR codes for redemption
- Replace single ticket view with multi-ticket list view

### Implementation Tasks

#### Frontend UI (1.5h)
- [ ] @redmoor Multi-ticket display component with grid layout
- [ ] @redmoor QR code generation for each ticket
- [ ] @redmoor "Show All Tickets" button on event page
- [ ] @redmoor Mobile-responsive ticket card layout

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
- [ ] @naqerl Add `referralData` parameter to `mintTicket` function
- [ ] @naqerl Emit `TicketMintedWithReferral` event
- [ ] @naqerl Write integration tests for referral tracking
- [ ] @naqerl Test edge cases (empty referral data, malformed data)

#### Backend Tracking (1h)
- [ ] @naqerl Create event listener for `TicketMintedWithReferral`
- [ ] @naqerl Add referral database schema (referrer, referee, event, timestamp)

#### Frontend Integration (3h)
- [ ] @redmoor Parse referral code from URL parameter (`?ref=address`)
- [ ] @redmoor Store referral code in local storage
- [ ] @redmoor Pass referral data to `mintTicket` transaction
- [ ] @redmoor Design UI to accept referral code in the field
- [ ] @redmoor Program UI to accept referral code

#### Select 3rd party provider for referrals and setup it (4h)
- [ ] @naqerl Select 3rd party provider for referrals and setup it

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
- [ ] @naqerl Add `customEventDeposit` field to EventPlace struct
- [ ] @naqerl Add `minEventDeposit` global variable
- [ ] @naqerl Update `submitEventPlaceRequest` to accept custom deposit
- [ ] @naqerl Modify `submitEventRequest` to use custom deposit if set, else global price
- [ ] @naqerl Add validation: custom deposit >= minEventDeposit

#### Backend API (1h)
- [ ] @naqerl Update EventPlace model schema with deposit field
- [ ] @naqerl Index deposit field from blockchain events
- [ ] @naqerl Update API serializers to include deposit

#### Frontend UI (1h)
- [ ] @redmoor Add deposit input field to event place creation form
- [ ] @redmoor Display deposit amount on event place details
- [ ] @redmoor Show deposit amount when creating event at a place

---

## 6. Flexible Revenue Distribution System (9 hours)

### Requirements
- **Fixed Platform Shares:** Hardcoded percentages - 10% CyberiaDAO LLC (platform), 5% CVE PT PMA (land owner)
- **Remaining funds:** Flexible distribution to multiple recipients
- **Use case:** After CyberiaDAO LLC (10%) and CVE PT PMA (5%) receive their shares, the remaining 85% can be distributed flexibly to:
  - Local provider (default)
  - Shaman
  - Sales
  - Multiple partners (marketing, venue, sponsors)
  - Dynamic allocation per event or campaign

### Architecture: Fully Encapsulated Distribution Contract

**Key Design Principle:** EventManager knows NOTHING about revenue distribution details. It simply transfers all funds to the DynamicRevenueSplitter contract, which handles all distribution logic internally (including fixed CyberiaDAO LLC/CVE PT PMA shares).

**Benefits:**
- EventManager remains simple and focused on event management
- All revenue logic centralized in one upgradeable contract
- No need to modify EventManager when changing distribution rules
- Clear separation of concerns

### Implementation Tasks

#### DynamicRevenueSplitter Contract (5h)
- [ ] @naqerl Create contract with immutable cyberiaDAO and cvePtPma addresses
- [ ] @naqerl Define fixed share constants (10% CyberiaDAO, 5% CVE PT PMA, 85% flexible)
- [ ] @naqerl Implement Distribution struct and profile mappings
- [ ] @naqerl Implement `createDistributionProfile` function
- [ ] @naqerl Implement `updateDistributionProfile` function
- [ ] @naqerl Implement `setDefaultProfile` and `setEventProfile` functions
- [ ] @naqerl Implement `distributeRevenue` main function (pull funds, split, distribute)
- [ ] @naqerl Implement `_distributeFlexible` internal function
- [ ] @naqerl Add profile validation (shares sum to 10000)

#### Integration with EventManager (1h)
- [ ] @naqerl Add `revenueSplitter` state variable to EventManager
- [ ] @naqerl Implement `setRevenueSplitter` function (admin only)
- [ ] @naqerl Update `distributeEventFunds` to approve and call splitter
- [ ] @naqerl Remove old master/provider distribution logic from EventManager
- [ ] @naqerl Remove masterShare state variable (no longer needed)

#### Testing (3h)
- [ ] @naqerl Test profile creation and updates
- [ ] @naqerl Test distribution calculations (10%, 5%, 85% splits)
- [ ] @naqerl Test event-specific profiles vs default profile
- [ ] @naqerl Test edge cases (zero amounts, single recipient, many recipients)
- [ ] @naqerl Test flexible portion distribution to local provider, shaman, sales, partners
- [ ] @naqerl Integration tests with EventManager

---

### Smart Contract: DynamicRevenueSplitter

**State Variables:**
```solidity
// Fixed recipients (immutable)
address public immutable cyberiaDAO;  // CyberiaDAO LLC - platform
address public immutable cvePtPma;    // CVE PT PMA - land owner

// Fixed shares (constants) - basis points where 10000 = 100%
uint256 public constant CYBERIA_DAO_SHARE = 1000;  // 10%
uint256 public constant CVE_PT_PMA_SHARE = 500;    // 5%
uint256 public constant FLEXIBLE_SHARE = 8500;     // 85%

// Distribution profiles for flexible portion
mapping(uint256 => Distribution) public distributions;
mapping(uint256 => uint256) public eventProfiles;  // eventId => profileId
uint256 public defaultProfileId;
```

**Key Functions:**

1. **`constructor(address _usdt, address _cyberiaDAO, address _cvePtPma, address _admin)`**
   - Sets immutable cyberiaDAO and cvePtPma addresses
   - Grants admin role

2. **`createDistributionProfile(address[] recipients, uint256[] shares) → uint256 profileId`**
   - Admin-only
   - Creates profile for flexible 85% portion
   - Shares must sum to 10000 (100% of flexible portion)
   - Recipients can include: local provider, shaman, sales, marketing, venue, sponsors
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
     2. Calculate: cyberiaDAOAmount (10%), cvePtPmaAmount (5%), flexibleAmount (85%)
     3. Transfer fixed shares to CyberiaDAO LLC and CVE PT PMA
     4. Look up profile (event-specific or default)
     5. Distribute flexible portion according to profile

**Core Distribution Flow:**

```
100 USDT revenue → distributeRevenue(100, eventId: 42)
├─ CyberiaDAO LLC: 10 USDT (10% fixed - platform)
├─ CVE PT PMA: 5 USDT (5% fixed - land owner)
└─ Flexible: 85 USDT (85% split by profile)
   ├─ If profile #1 = [provider: 5000, shaman: 2000, sales: 2000, marketing: 1000]
   ├─ Local Provider: 42.5 USDT (50% of 85)
   ├─ Shaman: 17 USDT (20% of 85)
   ├─ Sales: 17 USDT (20% of 85)
   └─ Marketing: 8.5 USDT (10% of 85)
```

---

## 8. Lifetime Revenue Display (3 hours)

### Requirements
- Add "Lifetime Revenue" button on Events screen (top right)
- Show total earnings i.e. amount of transferred USDTs for tickets

### Implementation Tasks

#### Backend Implementation (2h)
- [ ] @naqerl Add `total_revenue` field to Event model (DecimalField)
- [ ] @naqerl Update indexer to increment revenue on `TicketMinted` events
- [ ] @naqerl Create `lifetime_revenue` API endpoint

#### Frontend UI (2h)
- [ ] @redmoor Design UI
- [ ] @redmoor Create LifetimeRevenueButton component
- [ ] @redmoor Add React Query hook for fetching revenue

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
- [ ] @redmoor Implement ENS lookup service (using ethers.js)
- [ ] @redmoor Add caching layer for ENS lookups
- [ ] @redmoor Handle reverse resolution (address → ENS name)
- [ ] @redmoor Add fallback to address if no ENS found

#### UI Integration (1h)
- [ ] @redmoor Create AddressDisplay component (ENS > address)
- [ ] @redmoor Update all address displays across components
- [ ] @redmoor Add tooltip showing full address on hover

### 9.5 Telegram Verification Success (1 hour)

**Required:** Show success message after Telegram account connected

### 9.6 Login on Event Creation Form (2 hours)

**Required:** Show event form when not logged in, "Login to Create" button instead of Submit

- [ ] @redmoor Check authentication state in event creation form
- [ ] @redmoor Replace "Submit" button with "Login to Create" when not authenticated
- [ ] @redmoor Show login modal on button click
- [ ] @redmoor Redirect back to form after login

### 9.7 New Button → Popover (1 hours)

**Required:** "New" button opens popover with "New Event" and "New Event Space" options

- [ ] @redmoor Create popover menu component
- [ ] @redmoor Add "New Event" and "New Event Space" options
- [ ] @redmoor Position popover correctly (below button)

### 9.8 Signing with Expiration (3 hours)

**Required:** Reduce re-signing frequency by extending token lifetime

#### Backend (2h)
- [ ] @naqerl Extend JWT token lifetime configuration
- [ ] @naqerl Add expiration timestamp to signature payload
- [ ] @naqerl Implement expiration validation in auth middleware
- [ ] @naqerl Add token refresh endpoint

#### Frontend (1)
- [ ] @redmoor Store signature and expiration in local storage
- [ ] @redmoor Check expiration before API calls
- [ ] @redmoor Auto-refresh token when near expiration
- [ ] @redmoor Clear stored signature on logout

### 9.9 Notification Duplication (1h)

- [ ] @naqerl Mirror all notifications on the platform to telegram

---

## 10. Local Provider Share Display (2 hours)

### Requirements
- Show share percentage and socials in local provider list (for master)
- Show socials for shaman

### Implementation Tasks

#### Backend API (1h)
- [ ] @naqerl Add share percentage to local provider list endpoint
- [ ] @naqerl Include social media fields in API response
- [ ] @naqerl Add filtering/sorting by share percentage

#### Frontend UI (1h)
- [ ] @redmoor Update provider list table to show share percentage column
- [ ] @redmoor Display social media links (Instagram, Telegram, Discord)
- [ ] @redmoor Add visual indicators for verified accounts

---

## 11. Map Enhancements (7 hours)

### 11.1 Always-Visible Events Layer (1 hour)

**Required:** Events layer cannot be hidden, checkbox always checked and disabled

#### Tasks
- [ ] @redmoor Set events layer checkbox to always checked
- [ ] @redmoor Disable checkbox interaction
- [ ] @redmoor Add visual indicator that layer is always visible

### 11.2 Feature Attributes Display (4 hour)

**Required:** Show all attributes when clicking on map features

#### Tasks
- [ ] @naqerl Implement backend to sync attributes
- [ ] @redmoor Implement popup component for feature details
- [ ] @redmoor Display all feature properties from GeoJSON
- [ ] @redmoor Format attributes for readability
- [ ] @redmoor Add close button to popup

### 11.3 Yandex-Style Map Pin (1 hour)

**Required:** Use Yandex-style location pin instead of "E" icon

#### Tasks
- [ ] @redmoor Create or import Yandex-style pin icon/SVG
- [ ] @redmoor Replace current "E" marker with new pin
- [ ] @redmoor Ensure pin works with different marker states (selected, hover)
- [ ] @redmoor Update pin color scheme to match design

### 11.4 Layer List from Dima

**Status:** Waiting for layer specifications

### 11.5 Persist Rendered Map Between Navigations (1 hour)

#### Tasks
- [ ] @redmoor Store map state (zoom, center, layers) in a store
- [ ] @redmoor Restore map state on navigation back to map page
- [ ] @redmoor Prevent unnecessary re-renders
- [ ] @redmoor Add reset button to clear saved state

---

## 12. Thirdweb OneKey Issue (2h)

#### Tasks
- [ ] @redmoor Reproduce issue
- [ ] @redmoor Finds what's wrong

---

## 13. Monitoring & Reliability (5 hours)

### 13.1 Uptime Monitoring (4 hours)

**Required:** Monitor service availability, send alerts on failure

#### Uptime Kuma Setup (2h)
- [ ] @naqerl Install Uptime Kuma
- [ ] @naqerl Add service endpoints (backend API, frontend, indexer)
- [ ] @naqerl Configure monitoring intervals

#### Alert Configuration (2h)
- [ ] @naqerl Set up Telegram webhook for alerts
- [ ] @naqerl Configure notification rules (failure thresholds)
- [ ] @naqerl Test alert delivery
- [ ] @naqerl Add status page URL to documentation

### 13.2 Hourly Service Health Check (1 hour)

**Required:** Check services every hour, send Telegram alert on failure

#### Health Endpoint Implementation (0.5h)
- [ ] @naqerl Create `/api/health/` endpoint in Django
- [ ] @naqerl Add service status checks (database, blockchain connection)
- [ ] @naqerl Return structured health status JSON

#### Monitoring Integration (0.5h)
- [ ] @naqerl Configure Uptime Kuma to check `/api/health/` hourly
- [ ] @naqerl Set alert threshold to status != "alive"
- [ ] @naqerl Test automated alerts

---

## 14. Admin Dashboard - Verification Stats (6 hours)

### Requirements
- Show verification statistics for Master and Local Provider
- Current week vs previous week comparison
- Metrics: verified count, pending count, average verification time

### Implementation Tasks

#### Backend Analytics (3h)
- [ ] @naqerl Create weekly stats calculation endpoint
- [ ] @naqerl Calculate average verification time

#### Frontend Dashboard (3h)
- [ ] @redmoor Design UI
- [ ] @redmoor Create verification stats table component

---

## 15. Mimi Integration (14 hours)

### 15.1 Webhook Migration (8 hours)

- Use mimi for shaman verification and socials

mimi implemented in Go and is a completely different service with it's own infrastructure and Telegram does not support multiple bots listening for the events in the same time on the single bot token.

- Migrate mimi from long polling to webhooks
- Implement webhook redirection to tickets service
- Migrate tickets from long polling to webhooks

### 15.2 Dynamic GitHub Project Boards with Semantic Classification (6 hours)

**Repository:** `~/code/aishift/mimi`

**Current State:** 
1. GitHub project boards are hardcoded in `internal/bot/llm/agent/summary/summary.go`:
```go
var githubProjects = map[string]int{
    "rockets":      2,
    "supply":       3,
    "inventory":    24,
    "devops force": 33,
}
```

2. Report generation logic in `prompts/summary.prompt` has hardcoded project categorization:
   - "supply" and "inventory" projects are treated as supply-related (shown in 📦 Supplies section)
   - Other projects are treated as task-related (shown in 🚀 Project and Task Status section)

**Required:** 
1. Dynamically fetch available GitHub project boards from the organization
2. Develop an AI agent that semantically classifies projects into categories for report generation
3. Use LLM to understand project meaning from title/description and assign appropriate category (e.g., "supply", "task", "infrastructure", "operations")

#### Implementation Tasks

##### Backend Changes (2.5h)
- [ ] @naqerl Modify `SummaryAgent` to fetch projects dynamically at runtime
- [ ] @naqerl Use existing `ListProjects` function from `internal/provider/github/db/db.go`
- [ ] @naqerl Cache fetched projects list until they are changed
- [ ] @naqerl Add environment variable for GitHub organization name (`GITHUB_ORG`)
- [ ] @naqerl Update project fetching logic to handle dynamic project IDs
- [ ] @naqerl Add error handling for when projects cannot be fetched
- [ ] @naqerl Add logging for project discovery and caching

##### AI-Based Project Classification Agent (2h)
- [ ] @naqerl Create new prompt `project-classifier.prompt` for semantic project categorization
- [ ] @naqerl Define project categories: "supply" (inventory/materials), "task" (development/work), "infrastructure" (devops/systems), "operations" (admin/business)
- [ ] @naqerl Implement classification logic using LLM to analyze project title and description
- [ ] @naqerl Cache project classifications alongside project list
- [ ] @naqerl Add fallback rules if LLM classification fails (keyword matching)
- [ ] @naqerl Update `summary.prompt` to use dynamic categories instead of hardcoded project names
- [ ] @naqerl Pass categorized projects to summary generation with their semantic labels

##### Configuration & Environment (0.5h)
- [ ] @naqerl Add `GITHUB_PROJECT_CACHE_TTL` environment variable
- [ ] @naqerl Add `GITHUB_AUTO_DISCOVER_PROJECTS` flag (default: true, fallback to hardcoded)
- [ ] @naqerl Add `GITHUB_PROJECT_CLASSIFICATION_MODEL` for LLM model selection
- [ ] @naqerl Update `.env.production` and `example.env` with new variables
- [ ] @naqerl Document configuration options in README

##### Testing (1h)
- [ ] @naqerl Test project discovery with real GitHub API
- [ ] @naqerl Test AI classification accuracy with different project types
- [ ] @naqerl Test cache invalidation and refresh
- [ ] @naqerl Test fallback to hardcoded projects if API fails
- [ ] @naqerl Verify summary agent works with dynamically classified projects
- [ ] @naqerl Test report generation with various project category combinations
- [ ] @naqerl Test with organizations having different numbers of projects

**Benefits:**
- No need to update code when new projects are added
- Automatically discovers and categorizes organization projects
- Intelligent semantic understanding of project purpose
- Flexible report structure adapts to project types
- Reduces maintenance overhead
- More flexible for multi-organization deployments

---

## 16. Search Functionality for Admin Lists (6 hours)

### Requirements
- Add search bars to all lists visible to Local Provider and Master roles
- Search should be available for events list (all users)
- Search should automatically check main fields of searched entity
- Debounced input to avoid excessive API calls (300ms delay)

### Implementation Tasks

#### Backend Search Implementation (2.5h)
- [ ] @naqerl Add search query parameters to 7 list endpoints
- [ ] @naqerl Implement multi-field search using Django Q objects
- [ ] @naqerl Add search for Events list (title, place name, creator)
- [ ] @naqerl Add search for Event Places list (name, provider)
- [ ] @naqerl Add search for Verified Shamans list (address, Instagram, Telegram)
- [ ] @naqerl Add search for Local Providers list (address, Instagram, Telegram)
- [ ] @naqerl Add search for Staff list (address, Instagram, Telegram)
- [ ] @naqerl Add search for Notifications list (title, body)
- [ ] @naqerl Add search for Event attendees list (address, Instagram, Telegram)
- [ ] @naqerl Test search across all entity types

#### Frontend Search UI (3.5h)
- [ ] @redmoor Create reusable SearchBar component with debouncing (300ms)
- [ ] @redmoor Integrate SearchBar into Events list
- [ ] @redmoor Integrate SearchBar into Event Places list
- [ ] @redmoor Integrate SearchBar into Verified Shamans list
- [ ] @redmoor Integrate SearchBar into Local Providers list
- [ ] @redmoor Integrate SearchBar into Staff list
- [ ] @redmoor Integrate SearchBar into Notifications list
- [ ] @redmoor Integrate SearchBar into Event attendees list
- [ ] @redmoor Add clear search button (X icon)
- [ ] @redmoor Manage search state with React Query
- [ ] @redmoor Add loading indicator during search

---

## 17. Testing & Deployment (8 hours)

### End-to-End Testing (4 hours)
- [ ] @naqerl Test critical user flows (event creation, ticket purchase, verification)
- [ ] @naqerl Test contract interactions (categories, referrals, revenue distribution)
- [ ] @naqerl Verify revenue distribution calculations
- [ ] @naqerl Test search functionality across all lists
- [ ] @naqerl Validate role-based access controls

### Bug Fixes & Polish (3 hours)
- [ ] @naqerl Fix issues found during testing
- [ ] @naqerl Handle edge cases
- [ ] @naqerl Performance optimization
- [ ] @redmoor UI/UX polish

### Documentation & Deployment (1 hour)
- [ ] @naqerl Update deployment scripts
- [ ] @naqerl Write configuration documentation
- [ ] @naqerl Update README with new features

## 18. Give LocalProvider's authorities to master

- [ ] @naqerl Handle case for transferring places to master when LocalProvider is deleted
