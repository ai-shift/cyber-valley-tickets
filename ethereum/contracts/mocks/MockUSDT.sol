// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @dev Dev-only ERC20 used to mimic USDT-like behavior (6 decimals).
///      Name/symbol are intentionally "MockUSDT"/"mUSDT" to avoid collisions
///      with real tokens in wallets and token lists.
contract MockUSDT is ERC20, ERC20Permit {
    constructor() ERC20("MockUSDT", "mUSDT") ERC20Permit("MockUSDT") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}

