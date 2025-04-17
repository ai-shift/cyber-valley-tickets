// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

library CyberValley {
    struct Multihash {
        bytes32 digest;
        uint8 hashFunction;
        uint8 size;
    }
}
