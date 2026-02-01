# Remaining Tasks Summary

## Overview
The **Event Place Deposit Parameter** feature has been fully implemented and committed. Below is a summary of what remains to be done across the project.

## Completed (Event Place Deposit Parameter)
- Smart contract: Added `eventDepositSize` to EventPlace struct and approval flow
- Backend: Renamed `custom_event_deposit` to `event_deposit_size`, updated indexer
- Frontend: Added deposit input to approval dialog, fetch deposit for event submission
- Tests: Updated all Ethereum tests and indexer snapshots

## Remaining Tasks by Category

### High Priority

#### 1. Ticket Categories System (Frontend Only)
**Status:** Backend and contract complete, frontend pending
- [ ] Category selection dropdown on ticket purchase page
- [ ] Category management interface for event creators
- [ ] Display discount percentage on UI
- [ ] Show quota remaining for each category
**Owner:** @redmoor
**Est:** 2 hours

#### 2. Referral System - 3rd Party Provider
**Status:** Contract and frontend integration complete, provider selection pending
- [ ] Select and setup 3rd party provider for referrals
**Owner:** @naqerl
**Est:** 4 hours

#### 3. UX Improvements (Multiple items)
- [ ] Event Created → Show Event Page (1h)
- [ ] Ticket Bought → Stay on Event Page (2h)
- [ ] Hide Past Events (2h)
- [ ] ENS/Instagram Display (3h) - includes ENS resolution service
- [ ] Telegram Verification Success message (1h)
- [ ] Signing with Expiration - Backend (2h) + Frontend (1h)
- [ ] Notification Duplication to Telegram (1h)
**Owner:** @redmoor (frontend), @naqerl (backend)
**Est:** 13 hours total

#### 4. Map Enhancements
- [ ] Feature Attributes Display (backend sync + frontend popup) (4h)
**Owner:** @naqerl (backend), @redmoor (frontend)

#### 5. Admin Dashboard - Verification Stats
- [ ] Backend analytics endpoint (3h)
- [ ] Frontend stats table component (3h)
**Owner:** @naqerl (backend), @redmoor (frontend)
**Est:** 6 hours

### Medium Priority

#### 6. Local Provider Share Display
- [ ] Backend: Add share percentage to provider list endpoint (1h)
- [ ] Frontend: Update provider list table (1h)
**Owner:** @naqerl (backend), @redmoor (frontend)
**Est:** 2 hours

#### 7. Thirdweb OneKey Issue
- [ ] Reproduce and fix issue (2h)
**Owner:** @naqerl
**Est:** 2 hours

#### 8. Monitoring & Reliability
- [ ] Uptime Kuma setup (2h)
- [ ] Alert configuration (2h)
- [ ] Health endpoint implementation (0.5h)
- [ ] Monitoring integration (0.5h)
**Owner:** @naqerl
**Est:** 5 hours

### Lower Priority / Future

#### 9. Mimi Integration
- [ ] Webhook migration (8h)
- [ ] Dynamic GitHub project boards with AI classification (6h)
**Owner:** @naqerl
**Est:** 14 hours

#### 10. Testing & Deployment
- [ ] End-to-End Testing (4h)
- [ ] Bug Fixes & Polish (3h)
- [ ] Documentation & Deployment (1h)
**Owner:** @naqerl, @redmoor
**Est:** 8 hours

#### 11. Give LocalProvider's authorities to master
- [ ] Handle case for transferring places to master when LocalProvider is deleted
**Owner:** @naqerl

## Total Remaining Estimate
- **High Priority:** ~25 hours
- **Medium Priority:** ~9 hours
- **Lower Priority:** ~22 hours
- **Total:** ~56 hours

## Next Recommended Tasks
1. Complete Ticket Categories System frontend (2h)
2. Select 3rd party referral provider (4h)
3. ENS/Instagram Display feature (3h)
4. Map Feature Attributes Display (4h)
