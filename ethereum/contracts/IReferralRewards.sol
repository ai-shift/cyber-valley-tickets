// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IReferralRewards {
    /// @notice Process a purchase for `referee` with an optional `referrer` hint.
    /// @dev Must be called by the configured operator (EventManager).
    /// @return recipients Up to 3 upline addresses (level 1..3). Missing levels are zero-address.
    /// @return bonuses Per-level bonus amounts (aligned with `recipients`).
    /// @return totalPaid Sum of `bonuses`.
    function processPurchase(
        address referee,
        address referrer,
        uint256 amount
    )
        external
        returns (
            address[3] memory recipients,
            uint256[3] memory bonuses,
            uint256 totalPaid
        );
}

