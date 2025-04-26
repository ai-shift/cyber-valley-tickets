// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract SimpleERC20Xylose is ERC20, ERC20Permit {
    constructor()
        ERC20("SimpleERC20Xylose", "SEX")
        ERC20Permit("SimpleERC20Xylose")
    {}

    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
