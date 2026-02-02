// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IDynamicRevenueSplitter {
    function distributeRevenue(uint256 amount, uint256 eventId) external;
    function setEventProfile(uint256 eventId, uint256 profileId) external;
    function isProfileOwner(uint256 profileId, address account) external view returns (bool);
    function transferAllProfiles(address from, address to) external;
    function setEventManager(address _eventManager) external;
}
