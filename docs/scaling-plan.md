# Cyber Valley Tickets Scaling Plan: Multi-Master Architecture

## Overview

This document outlines the plan to scale the Cyber Valley Tickets application to support multiple master users (representing different platforms) with a new GOD role for system-wide administration.

## Current System Analysis

### Existing Roles
- **Customer**: Basic user role
- **Staff**: Can manage events (approve, decline, etc.)
- **Creator**: Can create events
- **Master**: Has all privileges (is_staff=True, is_creator=True)

### Current Architecture
- Single-tenant Django application
- Web3 authentication via SIWE
- Event management with approval workflow
- Ticket verification system
- IPFS integration for metadata storage

## Proposed Role Hierarchy

### GOD Role
- **Purpose**: System administrator with ultimate control
- **Privileges**:
  - Add/delete/disable master users
  - View all platforms and masters
  - Cannot be managed by anyone else
- **Scope**: Global (all platforms)

### Master Role (Enhanced)
- **Purpose**: Platform administrator
- **Privileges**:
  - All existing privileges within their platform
  - Manage staff and creators within their platform
  - View platform-specific data only
- **Scope**: Platform-specific

### Existing Roles (Platform-scoped)
- **Creator**: Create events within platform
- **Staff**: Manage events within platform
- **Customer**: Basic user within platform

## Database Schema Changes

### 1. Update CyberValleyUser Model
```python
class CyberValleyUser(AbstractBaseUser):
    # ... existing fields ...
    ROLE_CHOICES = (
        ("customer", "Customer"),
        ("staff", "Staff"),
        ("creator", "Creator"),
        ("master", "Master"),
        ("god", "GOD"),  # New role
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CUSTOMER)
    platform_id = models.CharField(max_length=100, null=True, blank=True)  # Null for GOD
    is_active = models.BooleanField(default=True)

    @property
    def is_god(self) -> bool:
        return self.role == self.GOD

    # ... existing properties ...
```

### 2. Update Event Model
```python
class Event(models.Model):
    # ... existing fields ...
    platform_id = models.CharField(max_length=100)
```

### 3. Update EventPlace Model
```python
class EventPlace(models.Model):
    # ... existing fields ...
    platform_id = models.CharField(max_length=100)
```

### 4. Update Ticket Model
```python
class Ticket(models.Model):
    # ... existing fields ...
    platform_id = models.CharField(max_length=100)
```

### 5. Platform Management
- Platform ID generation: Use master's address as platform_id
- GOD users have platform_id = None
- All data scoped by platform_id

## Backend API Changes

### 1. GOD Endpoints
- `POST /api/users/masters/` - Create new master
- `GET /api/users/masters/` - List all masters
- `PATCH /api/users/masters/{address}/` - Update master (disable/enable)
- `DELETE /api/users/masters/{address}/` - Delete master

### 2. Master Endpoints
- `GET /api/users/staff/` - List staff in platform (existing, enhanced)
- `POST /api/users/staff/` - Create staff user
- `PATCH /api/users/staff/{address}/` - Update staff role
- `DELETE /api/users/staff/{address}/` - Remove staff

### 3. Permission Classes
```python
class IsGOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_god

class PlatformPermission(BasePermission):
    def has_object_permission(self, request, obj, view):
        if request.user.is_god:
            return True
        return obj.platform_id == request.user.platform_id
```

### 4. Middleware for Platform Context
- Add middleware to set platform context based on user
- Filter querysets by platform automatically

## Frontend Changes

### 1. Update API Types
- Add "god" to RoleEnum
- Update user interfaces to include platform_id
- Add new endpoints for role management

### 2. GOD Dashboard
- Master management interface
- Platform overview
- System statistics

### 3. Master Dashboard (Enhanced)
- Platform-specific event management
- Staff/creator management within platform
- Platform analytics

### 4. Role-Based UI Components
- Conditional rendering based on user role
- Platform context display
- Role management forms

## Smart Contract Changes

### Current Smart Contract Architecture Analysis

The current smart contract system includes:

1. **CyberValleyEventManager.sol**
   - Single `MASTER_ROLE` with all administrative privileges
   - Event places, event management, date overlap checking
   - Single master address for revenue collection
   - Platform-agnostic event storage

2. **CyberValleyEventTicket.sol** 
   - NFT tickets with `MASTER_ROLE`, `STAFF_ROLE`, `EVENT_MANAGER_ROLE`
   - Ticket minting and redemption
   - IPFS metadata integration

3. **DateOverlapChecker.sol**
   - Handles event date conflicts per place ID
   - Uses bitmap storage for efficient date range tracking

### Required Smart Contract Updates

#### 1. Multi-Master EventManager Contract
```solidity
contract CyberValleyEventManager is AccessControl, DateOverlapChecker {
    bytes32 public constant GOD_ROLE = keccak256("GOD_ROLE");
    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    
    struct Platform {
        address master;
        bool active;
        uint256 createdAt;
    }
    
    mapping(address => Platform) public platforms;
    mapping(uint256 => address) public eventPlatforms; // eventId => platform
    mapping(uint256 => address) public placePlatforms; // placeId => platform
    
    modifier onlyGod() {
        require(hasRole(GOD_ROLE, msg.sender), "Must have GOD role");
        _;
    }
    
    modifier onlyMasterOrGod() {
        require(
            hasRole(MASTER_ROLE, msg.sender) || hasRole(GOD_ROLE, msg.sender),
            "Must have master or GOD role"
        );
        _;
    }
    
    function addMaster(address masterAddress) external onlyGod {
        platforms[masterAddress] = Platform(masterAddress, true, block.timestamp);
        _grantRole(MASTER_ROLE, masterAddress);
    }
    
    function removeMaster(address masterAddress) external onlyGod {
        platforms[masterAddress].active = false;
        _revokeRole(MASTER_ROLE, masterAddress);
    }
}
```

#### 2. Platform-Scoped Operations
- Event places scoped to platform master
- Revenue distribution to respective platform masters
- Cross-platform event overlap prevention

#### 3. Enhanced Ticket Contract
```solidity
contract CyberValleyEventTicket is ERC721, AccessControl {
    bytes32 public constant GOD_ROLE = keccak256("GOD_ROLE");
    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE"); 
    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
    
    mapping(uint256 => address) public ticketPlatforms; // tokenId => platform
    
    modifier onlyPlatformStaff(uint256 tokenId) {
        address platform = ticketPlatforms[tokenId];
        require(
            hasRole(MASTER_ROLE, msg.sender) && platforms[msg.sender].active ||
            hasRole(STAFF_ROLE, msg.sender) && staffPlatforms[msg.sender] == platform,
            "Must be platform staff"
        );
        _;
    }
}
```

### Implementation Strategy

#### Phase 1: Contract Updates
1. Deploy new multi-master EventManager contract
2. Update EventTicket contract with platform support
3. Implement migration from single to multi-master

#### Phase 2: Platform Integration
1. Platform registration through GOD role
2. Event/place assignment to platforms
3. Revenue distribution per platform

#### Phase 3: Cross-Platform Features
1. Cross-platform ticket verification
2. Platform-specific contract instances
3. Inter-platform event coordination

### Security Considerations

#### 1. Role Hierarchy Enforcement
- GOD role cannot be granted/revoked except by other GOD users
- Master roles scoped to specific platforms
- Staff roles inherit from platform masters

#### 2. Platform Isolation
- Events/places owned by specific platforms
- Revenue flows to correct platform masters
- Cross-platform access controls

#### 3. Migration Safety
- Existing events/tickets remain functional
- Gradual migration to multi-platform structure
- Rollback mechanisms for critical failures

### Gas Optimization

#### 1. Efficient Platform Checks
- Bitmap-based platform permissions
- Cached platform lookups
- Optimized role verification

#### 2. Batch Operations
- Multi-event approvals per platform
- Batch ticket minting
- Efficient date range allocation

### Future Enhancements
- On-chain governance for platform parameters
- Automated revenue sharing contracts
- Cross-chain platform support
- Decentralized platform registry

## Migration Strategy

### Phase 1: Database Migration
1. Add GOD role to existing schema
2. Add platform_id fields with default values
3. Create migration scripts
4. Data migration for existing users

### Phase 2: Backend Implementation
1. Update models and serializers
2. Implement new endpoints
3. Update permissions and middleware
4. Add platform filtering

### Phase 3: Frontend Implementation
1. Update API integration
2. Implement GOD and enhanced master UIs
3. Add role management components
4. Update existing components for platform context

### Phase 4: Testing and Deployment
1. Unit tests for new functionality
2. Integration tests for multi-platform scenarios
3. Load testing for scaled architecture
4. Gradual rollout with feature flags

## Security Considerations

### 1. Platform Isolation
- Strict database-level filtering by platform_id
- API-level permission checks
- Audit logging for cross-platform access

### 2. GOD Role Security
- Limited number of GOD users
- Enhanced authentication requirements
- Audit trail for all GOD actions

### 3. Master Role Security
- Platform-scoped permissions
- Cannot access other platforms' data
- Master creation requires GOD approval

## Monitoring and Analytics

### 1. Platform Metrics
- Events per platform
- User activity by platform
- Revenue tracking by platform

### 2. System Health
- GOD action logs
- Master activity monitoring
- Cross-platform data integrity checks

## Conclusion

This plan provides a comprehensive approach to scaling Cyber Valley Tickets for multiple platforms while maintaining security and performance. The introduction of the GOD role and enhanced master capabilities will enable efficient management of multiple platforms while preserving the existing functionality.
