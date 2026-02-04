// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IDynamicRevenueSplitter.sol";

contract DynamicRevenueSplitter is IDynamicRevenueSplitter, AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROFILE_MANAGER_ROLE = keccak256("PROFILE_MANAGER_ROLE");

    // Fixed recipients (immutable)
    address public immutable cyberiaDAO;      // CyberiaDAO LLC - platform
    address public immutable cvePtPma;        // CVE PT PMA - land owner
    IERC20 public immutable usdt;

    // Fixed shares (constants) - basis points where 10000 = 100%
    uint256 public constant CYBERIA_DAO_SHARE = 1000;      // 10%
    uint256 public constant CVE_PT_PMA_SHARE = 500;        // 5%
    uint256 public constant MAX_PROFILE_MANAGER_BPS = 8500; // 85% max for profile manager
    uint256 public constant BASIS_POINTS = 10000;

    struct Distribution {
        address[] recipients;
        uint256[] shares; // Basis points (10000 = 100% of remaining portion after fixed + manager)
        address owner;        // Owner of this profile
        bool isActive;        // Soft delete capability
    }

    Distribution[] internal profiles;
    mapping(uint256 => uint256) public eventProfiles;       // eventId => profileId
    mapping(address => uint256[]) public ownerProfiles;     // owner => profileIds[]
    
    /**
     * @notice Basis points each profile manager receives from distributions.
     * Applied after fixed bps (CyberiaDAO 10% + CVE PT PMA 5%) and before 
     * profile recipients. Manager cannot add their own address to distribution profiles.
     */
    mapping(address => uint256) public profileManagerBps;   // basis points for each manager
    
    address public eventManager;

    event DistributionProfileCreated(
        uint256 indexed profileId,
        address indexed owner,
        address[] recipients,
        uint256[] shares
    );
    event DistributionProfileUpdated(uint256 indexed profileId, address[] recipients, uint256[] shares);
    event EventProfileSet(uint256 indexed eventId, uint256 profileId);
    event RevenueDistributed(uint256 amount, uint256 indexed eventId);
    event ProfileOwnershipTransferred(
        uint256 indexed profileId,
        address indexed previousOwner,
        address indexed newOwner
    );
    event ProfileDeactivated(uint256 indexed profileId);
    
    /**
     * @notice Emitted when a profile manager is granted role with bps share
     * @param account The account granted PROFILE_MANAGER_ROLE
     * @param bps The basis points (0-8500) applied after fixed bps and before profile recipients
     */
    event ProfileManagerGranted(address indexed account, uint256 bps);

    constructor(
        address _usdt,
        address _cyberiaDAO,
        address _cvePtPma,
        address _admin
    ) {
        require(_usdt != address(0), "USDT address cannot be zero");
        require(_cyberiaDAO != address(0), "CyberiaDAO address cannot be zero");
        require(_cvePtPma != address(0), "CVE PT PMA address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        usdt = IERC20(_usdt);
        cyberiaDAO = _cyberiaDAO;
        cvePtPma = _cvePtPma;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    function setEventManager(address _eventManager) external onlyRole(ADMIN_ROLE) {
        require(_eventManager != address(0), "EventManager cannot be zero address");
        eventManager = _eventManager;
    }

    modifier onlyAdminOrEventManager() {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || msg.sender == eventManager,
            "Caller must be admin or EventManager"
        );
        _;
    }

    modifier onlyProfileOwnerOrAdmin(uint256 profileId) {
        require(profileId > 0 && profileId <= profiles.length, "Profile does not exist");
        require(
            profiles[profileId - 1].owner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Caller must be profile owner or admin"
        );
        _;
    }

    /**
     * @notice Grants PROFILE_MANAGER_ROLE to an account with specified bps share
     * @param account The address to grant the role to
     * @param bps The basis points (0-8500) this account receives from each distribution.
     *           Applied after fixed bps (CyberiaDAO 10% + CVE PT PMA 5%) and before 
     *           profile recipients. Account cannot add themselves to distribution profiles.
     */
    function grantProfileManager(address account, uint256 bps) external onlyAdminOrEventManager {
        require(account != address(0), "Account cannot be zero address");
        require(bps <= MAX_PROFILE_MANAGER_BPS, "Bps must be <= 8500");
        
        _grantRole(PROFILE_MANAGER_ROLE, account);
        profileManagerBps[account] = bps;
        
        emit ProfileManagerGranted(account, bps);
    }

    function createDistributionProfile(
        address[] calldata recipients,
        uint256[] calldata shares
    ) external returns (uint256) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(PROFILE_MANAGER_ROLE, msg.sender),
            "Caller must have ADMIN_ROLE or PROFILE_MANAGER_ROLE"
        );

        // Profile manager cannot add themselves to recipients - they get bps automatically
        if (hasRole(PROFILE_MANAGER_ROLE, msg.sender)) {
            for (uint256 i = 0; i < recipients.length; i++) {
                require(recipients[i] != msg.sender, "Profile manager cannot add themselves to distribution");
            }
        }

        _validateDistribution(recipients, shares);
        
        uint256 profileId = profiles.length + 1;
        profiles.push(Distribution(recipients, shares, msg.sender, true));
        ownerProfiles[msg.sender].push(profileId);

        emit DistributionProfileCreated(profileId, msg.sender, recipients, shares);
        return profileId;
    }

    function updateDistributionProfile(
        uint256 profileId,
        address[] calldata recipients,
        uint256[] calldata shares
    ) external onlyProfileOwnerOrAdmin(profileId) {
        // Profile owner cannot add themselves to recipients - they get bps automatically
        if (hasRole(PROFILE_MANAGER_ROLE, msg.sender)) {
            for (uint256 i = 0; i < recipients.length; i++) {
                require(recipients[i] != msg.sender, "Profile manager cannot add themselves to distribution");
            }
        }
        
        _validateDistribution(recipients, shares);
        Distribution storage profile = profiles[profileId - 1];
        profile.recipients = recipients;
        profile.shares = shares;
        emit DistributionProfileUpdated(profileId, recipients, shares);
    }

    function setEventProfile(uint256 eventId, uint256 profileId) external override {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || msg.sender == eventManager,
            "Caller must be admin or EventManager"
        );
        require(profileId > 0 && profileId <= profiles.length, "Profile does not exist");
        require(profiles[profileId - 1].isActive, "Profile is not active");
        eventProfiles[eventId] = profileId;
        emit EventProfileSet(eventId, profileId);
    }

    function distributeRevenue(uint256 amount, uint256 eventId) external override nonReentrant {
        require(amount > 0, "Amount must be greater than zero");

        // Pull funds from EventManager
        require(usdt.transferFrom(msg.sender, address(this), amount), "USDT transfer from EventManager failed");

        uint256 cyberiaDAOAmount = (amount * CYBERIA_DAO_SHARE) / BASIS_POINTS;
        uint256 cvePtPmaAmount = (amount * CVE_PT_PMA_SHARE) / BASIS_POINTS;
        
        // Get profile manager for this event and their bps
        uint256 profileId = eventProfiles[eventId];
        address manager = profileId > 0 ? profiles[profileId - 1].owner : address(0);
        uint256 managerBps = manager == address(0) ? 0 : profileManagerBps[manager];
        uint256 managerAmount = (amount * managerBps) / BASIS_POINTS;
        
        // Remaining amount goes to profile recipients
        uint256 flexibleAmount = amount - cyberiaDAOAmount - cvePtPmaAmount - managerAmount;

        // Distribute fixed shares
        if (cyberiaDAOAmount > 0) {
            require(usdt.transfer(cyberiaDAO, cyberiaDAOAmount), "Transfer to CyberiaDAO failed");
        }
        if (cvePtPmaAmount > 0) {
            require(usdt.transfer(cvePtPma, cvePtPmaAmount), "Transfer to CVE PT PMA failed");
        }
        if (managerAmount > 0 && manager != address(0)) {
            require(usdt.transfer(manager, managerAmount), "Transfer to profile manager failed");
        }

        // Distribute flexible portion to profile recipients
        if (flexibleAmount > 0 && profileId > 0) {
            _distributeFlexible(flexibleAmount, profileId);
        }

        emit RevenueDistributed(amount, eventId);
    }

    function _distributeFlexible(uint256 flexibleAmount, uint256 profileId) internal {
        Distribution storage profile = profiles[profileId - 1];
        require(profile.isActive, "Profile is not active");

        uint256 distributed = 0;
        for (uint256 i = 0; i < profile.recipients.length; i++) {
            uint256 shareAmount;
            if (i == profile.recipients.length - 1) {
                // Last recipient gets the remainder to handle rounding
                shareAmount = flexibleAmount - distributed;
            } else {
                shareAmount = (flexibleAmount * profile.shares[i]) / BASIS_POINTS;
            }

            if (shareAmount > 0) {
                require(usdt.transfer(profile.recipients[i], shareAmount), "Flexible transfer failed");
                distributed += shareAmount;
            }
        }
    }

    function getProfile(uint256 profileId) external view returns (
        address[] memory recipients,
        uint256[] memory shares,
        address owner,
        bool isActive
    ) {
        require(profileId > 0 && profileId <= profiles.length, "Profile does not exist");
        Distribution storage profile = profiles[profileId - 1];
        return (profile.recipients, profile.shares, profile.owner, profile.isActive);
    }

    function isProfileOwner(uint256 profileId, address account) external view override returns (bool) {
        require(profileId > 0 && profileId <= profiles.length, "Profile does not exist");
        return profiles[profileId - 1].owner == account;
    }

    function getProfilesByOwner(address owner) external view returns (uint256[] memory) {
        return ownerProfiles[owner];
    }

    function transferProfileOwnership(uint256 profileId, address newOwner) external onlyRole(ADMIN_ROLE) {
        require(profileId > 0 && profileId <= profiles.length, "Profile does not exist");
        require(newOwner != address(0), "New owner cannot be zero address");

        Distribution storage profile = profiles[profileId - 1];
        address previousOwner = profile.owner;
        require(previousOwner != newOwner, "New owner must be different");

        // Remove profileId from previous owner's list
        uint256[] storage prevOwnerProfiles = ownerProfiles[previousOwner];
        for (uint256 i = 0; i < prevOwnerProfiles.length; i++) {
            if (prevOwnerProfiles[i] == profileId) {
                prevOwnerProfiles[i] = prevOwnerProfiles[prevOwnerProfiles.length - 1];
                prevOwnerProfiles.pop();
                break;
            }
        }

        // Add to new owner's list
        profile.owner = newOwner;
        ownerProfiles[newOwner].push(profileId);

        emit ProfileOwnershipTransferred(profileId, previousOwner, newOwner);
    }

    function transferAllProfiles(address from, address to) external override onlyRole(ADMIN_ROLE) {
        require(from != address(0), "From address cannot be zero");
        require(to != address(0), "To address cannot be zero");
        require(from != to, "From and to must be different");

        uint256[] storage fromProfiles = ownerProfiles[from];
        uint256[] storage toProfiles = ownerProfiles[to];

        for (uint256 i = 0; i < fromProfiles.length; i++) {
            uint256 profileId = fromProfiles[i];
            profiles[profileId - 1].owner = to;
            toProfiles.push(profileId);
        }

        // Clear from's list
        delete ownerProfiles[from];
    }

    function deactivateProfile(uint256 profileId) external onlyProfileOwnerOrAdmin(profileId) {
        profiles[profileId - 1].isActive = false;
        emit ProfileDeactivated(profileId);
    }

    function _validateDistribution(address[] calldata recipients, uint256[] calldata shares) internal pure {
        require(recipients.length == shares.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty distribution");
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(recipients[i] != address(0), "Zero address recipient");
            totalShares += shares[i];
        }
        require(totalShares == BASIS_POINTS, "Shares must sum to 10000");
    }
}
