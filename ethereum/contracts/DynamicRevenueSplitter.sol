// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IDynamicRevenueSplitter.sol";

contract DynamicRevenueSplitter is IDynamicRevenueSplitter, AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Fixed recipients (immutable)
    address public immutable cyberiaDAO;  // CyberiaDAO LLC - platform
    address public immutable cvePtPma;    // CVE PT PMA - land owner
    IERC20 public immutable usdt;

    // Fixed shares (constants) - basis points where 10000 = 100%
    uint256 public constant CYBERIA_DAO_SHARE = 1000;  // 10%
    uint256 public constant CVE_PT_PMA_SHARE = 500;    // 5%
    uint256 public constant FLEXIBLE_SHARE = 8500;     // 85%
    uint256 public constant BASIS_POINTS = 10000;

    struct Distribution {
        address[] recipients;
        uint256[] shares; // Basis points (10000 = 100% of flexible portion)
    }

    mapping(uint256 => Distribution) internal profiles;
    mapping(uint256 => uint256) public eventProfiles;  // eventId => profileId
    uint256 public defaultProfileId;
    uint256 public nextProfileId = 1;

    event DistributionProfileCreated(uint256 indexed profileId, address[] recipients, uint256[] shares);
    event DistributionProfileUpdated(uint256 indexed profileId, address[] recipients, uint256[] shares);
    event DefaultProfileSet(uint256 profileId);
    event EventProfileSet(uint256 indexed eventId, uint256 profileId);
    event RevenueDistributed(uint256 amount, uint256 indexed eventId);

    constructor(address _usdt, address _cyberiaDAO, address _cvePtPma, address _admin) {
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

    function createDistributionProfile(address[] calldata recipients, uint256[] calldata shares) external onlyRole(ADMIN_ROLE) returns (uint256) {
        _validateDistribution(recipients, shares);
        uint256 profileId = nextProfileId++;
        profiles[profileId] = Distribution(recipients, shares);
        emit DistributionProfileCreated(profileId, recipients, shares);
        return profileId;
    }

    function updateDistributionProfile(uint256 profileId, address[] calldata recipients, uint256[] calldata shares) external onlyRole(ADMIN_ROLE) {
        require(profileId > 0 && profileId < nextProfileId, "Profile does not exist");
        _validateDistribution(recipients, shares);
        profiles[profileId] = Distribution(recipients, shares);
        emit DistributionProfileUpdated(profileId, recipients, shares);
    }

    function setDefaultProfile(uint256 profileId) external onlyRole(ADMIN_ROLE) {
        require(profileId > 0 && profileId < nextProfileId, "Profile does not exist");
        defaultProfileId = profileId;
        emit DefaultProfileSet(profileId);
    }

    function setEventProfile(uint256 eventId, uint256 profileId) external onlyRole(ADMIN_ROLE) {
        require(profileId > 0 && profileId < nextProfileId, "Profile does not exist");
        eventProfiles[eventId] = profileId;
        emit EventProfileSet(eventId, profileId);
    }

    function distributeRevenue(uint256 amount, uint256 eventId) external override nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        
        // Pull funds from EventManager
        require(usdt.transferFrom(msg.sender, address(this), amount), "USDT transfer from EventManager failed");

        uint256 cyberiaDAOAmount = (amount * CYBERIA_DAO_SHARE) / BASIS_POINTS;
        uint256 cvePtPmaAmount = (amount * CVE_PT_PMA_SHARE) / BASIS_POINTS;
        uint256 flexibleAmount = amount - cyberiaDAOAmount - cvePtPmaAmount;

        // Distribute fixed shares
        if (cyberiaDAOAmount > 0) {
            require(usdt.transfer(cyberiaDAO, cyberiaDAOAmount), "Transfer to CyberiaDAO failed");
        }
        if (cvePtPmaAmount > 0) {
            require(usdt.transfer(cvePtPma, cvePtPmaAmount), "Transfer to CVE PT PMA failed");
        }

        // Distribute flexible portion
        if (flexibleAmount > 0) {
            _distributeFlexible(flexibleAmount, eventId);
        }

        emit RevenueDistributed(amount, eventId);
    }

    function _distributeFlexible(uint256 flexibleAmount, uint256 eventId) internal {
        uint256 profileId = eventProfiles[eventId];
        if (profileId == 0) {
            profileId = defaultProfileId;
        }
        require(profileId != 0, "No distribution profile set");

        Distribution storage profile = profiles[profileId];
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

    function getProfile(uint256 profileId) external view returns (address[] memory recipients, uint256[] memory shares) {
        require(profileId > 0 && profileId < nextProfileId, "Profile does not exist");
        Distribution storage profile = profiles[profileId];
        return (profile.recipients, profile.shares);
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
