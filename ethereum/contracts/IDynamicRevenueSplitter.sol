// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IDynamicRevenueSplitter {
    function distributeRevenue(uint256 amount, uint256 eventId) external;
    function setEventProfile(uint256 eventId, uint256 profileId) external;
    function isProfileOwner(uint256 profileId, address account) external view returns (bool);
    function transferAllProfiles(address from, address to) external;
    function setEventManager(address _eventManager) external;
    
    /**
     * @notice Grants PROFILE_MANAGER_ROLE to an account with a specified bps share
     * @param account The address to grant the role to
     * @param bps The basis points (0-8500) this account receives from each distribution.
     *           Applied after fixed bps (CyberiaDAO 10% + CVE PT PMA 5%) and before 
     *           profile recipients. Account cannot add themselves to distribution profiles.
     */
    function grantProfileManager(address account, uint256 bps) external;
}
