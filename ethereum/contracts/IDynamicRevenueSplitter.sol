// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IDynamicRevenueSplitter {
    function distributeRevenue(uint256 amount, uint256 eventId) external;
}
