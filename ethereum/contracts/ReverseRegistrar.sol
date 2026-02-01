// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IENS {
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns(bytes32);
    function owner(bytes32 node) external view returns (address);
}

interface IResolver {
    function setName(bytes32 node, string calldata name) external;
}

contract ReverseRegistrar {
    IENS public ens;
    IResolver public defaultResolver;
    bytes32 public constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;
    
    constructor(IENS _ens, IResolver _resolver) {
        ens = _ens;
        defaultResolver = _resolver;
    }
    
    function setName(string calldata name) external returns (bytes32) {
        bytes32 label = sha3HexAddress(msg.sender);
        bytes32 node = keccak256(abi.encodePacked(ADDR_REVERSE_NODE, label));
        
        // Claim the node for the caller
        IENS(ens).setSubnodeOwner(ADDR_REVERSE_NODE, label, msg.sender);
        
        return node;
    }
    
    function sha3HexAddress(address addr) private pure returns (bytes32 ret) {
        addr;
        ret;
        assembly {
            let lookup := 0x3031323334353637383961626364656600000000000000000000000000000000
            let i := 40
            
            for { } gt(i, 0) { } {
                i := sub(i, 1)
                mstore8(i, byte(and(addr, 0xf), lookup))
                addr := div(addr, 0x10)
                i := sub(i, 1)
                mstore8(i, byte(and(addr, 0xf), lookup))
                addr := div(addr, 0x10)
            }
            
            ret := keccak256(0, 40)
        }
    }
}
