// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IReferralRewards.sol";

/// @notice Referral reward engine adapted from ThunderCore's referral library idea,
/// but designed to be paid in an ERC20 token by the caller (EventManager).
///
/// Key points:
/// - 3 levels maximum.
/// - Bonus depends on (a) referral bonus %, (b) level split %, (c) upline referee-count rate.
/// - "Active" gating: when enabled, only uplines active within `secondsUntilInactive` earn.
/// - This contract does not transfer tokens; it returns computed payouts and updates state.
///   The operator (EventManager) performs ERC20 transfers from its own balance.
contract ReferralRewards is AccessControl, IReferralRewards {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct RateStep {
        uint32 refereeCount; // minimum direct referees required
        uint32 rate; // [0..decimals] where decimals is typically 10000 (bps-style)
    }

    IERC20 public immutable rewardToken;
    uint32 public immutable decimals;

    uint32 public referralBonus; // [0..decimals]
    uint32 public secondsUntilInactive;
    bool public onlyRewardActiveReferrers;

    // levelRates[0] = level-1 share; [1] level-2; [2] level-3. Each [0..decimals].
    uint32[3] public levelRates;
    RateStep[] private _rateSteps;

    mapping(address => address) public referrerOf;
    mapping(address => uint32) public directRefereeCount;
    mapping(address => uint256) public lastActiveAt;

    event ReferrerSet(address indexed referee, address indexed referrer);
    event ActiveUpdated(address indexed user, uint256 timestamp);
    event ConfigUpdated(
        uint32 referralBonus,
        uint32 secondsUntilInactive,
        bool onlyRewardActiveReferrers,
        uint32 level1,
        uint32 level2,
        uint32 level3
    );

    error InvalidConfig();

    constructor(
        IERC20 _rewardToken,
        address admin,
        address operator,
        uint32 _decimals,
        uint32 _referralBonus,
        uint32 _secondsUntilInactive,
        bool _onlyRewardActiveReferrers,
        uint32[3] memory _levelRates,
        RateStep[] memory rateSteps
    ) {
        rewardToken = _rewardToken;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);

        if (_decimals == 0) revert InvalidConfig();
        decimals = _decimals;

        _setConfig(
            _referralBonus,
            _secondsUntilInactive,
            _onlyRewardActiveReferrers,
            _levelRates
        );

        _setRateSteps(rateSteps);
    }

    function setOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(OPERATOR_ROLE, operator);
    }

    function setConfig(
        uint32 _referralBonus,
        uint32 _secondsUntilInactive,
        bool _onlyRewardActiveReferrers,
        uint32[3] memory _levelRates
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setConfig(
            _referralBonus,
            _secondsUntilInactive,
            _onlyRewardActiveReferrers,
            _levelRates
        );
    }

    function setRateSteps(
        RateStep[] calldata rateSteps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setRateSteps(rateSteps);
    }

    function rateStepsLength() external view returns (uint256) {
        return _rateSteps.length;
    }

    function rateStepAt(uint256 idx) external view returns (RateStep memory) {
        return _rateSteps[idx];
    }

    function isActive(address user) public view returns (bool) {
        uint256 ts = lastActiveAt[user];
        if (ts == 0) return false;
        // secondsUntilInactive == 0 means "always active"
        if (secondsUntilInactive == 0) return true;
        return block.timestamp <= ts + secondsUntilInactive;
    }

    function processPurchase(
        address referee,
        address referrer,
        uint256 amount
    )
        external
        override
        onlyRole(OPERATOR_ROLE)
        returns (
            address[3] memory recipients,
            uint256[3] memory bonuses,
            uint256 totalPaid
        )
    {
        // Mark the buyer active even if they have no referrer.
        lastActiveAt[referee] = block.timestamp;
        emit ActiveUpdated(referee, block.timestamp);

        // Bind referrer on first purchase if valid hint is provided.
        if (referrer != address(0)) {
            _trySetReferrer(referee, referrer);
        }

        if (amount == 0 || referralBonus == 0) {
            return (recipients, bonuses, 0);
        }

        uint256 referralBase = (amount * uint256(referralBonus)) / uint256(decimals);

        address current = referee;
        for (uint256 level = 0; level < 3; level++) {
            address upline = referrerOf[current];
            if (upline == address(0)) break;

            recipients[level] = upline;

            if (!onlyRewardActiveReferrers || isActive(upline)) {
                uint256 refereeRate = uint256(_refereeCountRate(upline));
                uint256 levelRate = uint256(levelRates[level]);

                uint256 bonus = referralBase;
                bonus = (bonus * refereeRate) / uint256(decimals);
                bonus = (bonus * levelRate) / uint256(decimals);

                bonuses[level] = bonus;
                totalPaid += bonus;
            }

            current = upline;
        }

        return (recipients, bonuses, totalPaid);
    }

    function _trySetReferrer(address referee, address referrer) internal {
        if (referee == address(0) || referrer == address(0)) return;
        if (referee == referrer) return;
        if (referrerOf[referee] != address(0)) return;

        // Prevent short cycles within the 3-level depth this system uses.
        address cur = referrer;
        for (uint256 i = 0; i < 3; i++) {
            if (cur == address(0)) break;
            if (cur == referee) return;
            cur = referrerOf[cur];
        }

        referrerOf[referee] = referrer;
        directRefereeCount[referrer] += 1;
        emit ReferrerSet(referee, referrer);
    }

    function _refereeCountRate(address user) internal view returns (uint32) {
        // Default: 100% (no reduction).
        if (_rateSteps.length == 0) return decimals;

        uint32 cnt = directRefereeCount[user];
        uint32 best = 0;

        // Steps must be sorted ascending by refereeCount.
        for (uint256 i = 0; i < _rateSteps.length; i++) {
            if (cnt < _rateSteps[i].refereeCount) break;
            best = _rateSteps[i].rate;
        }

        // If user has fewer referees than the first threshold, best will be 0.
        return best;
    }

    function _setConfig(
        uint32 _referralBonus,
        uint32 _secondsUntilInactive,
        bool _onlyRewardActiveReferrers,
        uint32[3] memory _levelRates
    ) internal {
        if (_referralBonus > decimals) revert InvalidConfig();

        // Require the level split to be <= 100%.
        uint256 sum = uint256(_levelRates[0]) +
            uint256(_levelRates[1]) +
            uint256(_levelRates[2]);
        if (sum > uint256(decimals)) revert InvalidConfig();

        referralBonus = _referralBonus;
        secondsUntilInactive = _secondsUntilInactive;
        onlyRewardActiveReferrers = _onlyRewardActiveReferrers;
        levelRates = _levelRates;

        emit ConfigUpdated(
            referralBonus,
            secondsUntilInactive,
            onlyRewardActiveReferrers,
            levelRates[0],
            levelRates[1],
            levelRates[2]
        );
    }

    function _setRateSteps(RateStep[] memory rateSteps) internal {
        delete _rateSteps;

        uint32 prev = 0;
        for (uint256 i = 0; i < rateSteps.length; i++) {
            if (rateSteps[i].rate > decimals) revert InvalidConfig();
            if (i > 0 && rateSteps[i].refereeCount <= prev) revert InvalidConfig();
            prev = rateSteps[i].refereeCount;
            _rateSteps.push(rateSteps[i]);
        }
    }
}

