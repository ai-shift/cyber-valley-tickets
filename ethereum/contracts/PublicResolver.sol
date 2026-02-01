// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IENS {
    function owner(bytes32 node) external view returns (address);
    function resolver(bytes32 node) external view returns (address);
}

interface IResolver {
    function setAddr(bytes32 node, address addr) external;
    function addr(bytes32 node) external view returns (address);
    function setName(bytes32 node, string calldata name) external;
    function name(bytes32 node) external view returns (string memory);
}

contract PublicResolver is IResolver {
    IENS public ens;
    
    mapping(bytes32 => address) public addrs;
    mapping(bytes32 => string) public names;
    
    modifier authorised(bytes32 node) {
        require(msg.sender == ens.owner(node), "Not authorised");
        _;
    }
    
    constructor(IENS _ens) {
        ens = _ens;
    }
    
    function setAddr(bytes32 node, address addr) external override authorised(node) {
        addrs[node] = addr;
    }
    
    function addr(bytes32 node) external view override returns (address) {
        return addrs[node];
    }
    
    function setName(bytes32 node, string calldata name) external override authorised(node) {
        names[node] = name;
    }
    
    function name(bytes32 node) external view override returns (string memory) {
        return names[node];
    }
}
