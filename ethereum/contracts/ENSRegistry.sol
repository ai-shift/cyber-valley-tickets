// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IENS {
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);
    event Transfer(bytes32 indexed node, address owner);
    event NewResolver(bytes32 indexed node, address resolver);
    event NewTTL(bytes32 indexed node, uint64 ttl);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function setRecord(bytes32 node, address owner, address resolver, uint64 ttl) external;
    function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external;
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns(bytes32);
    function setResolver(bytes32 node, address resolver) external;
    function setOwner(bytes32 node, address owner) external;
    function setApprovalForAll(address operator, bool approved) external;
    function owner(bytes32 node) external view returns (address);
    function resolver(bytes32 node) external view returns (address);
    function recordExists(bytes32 node) external view returns (bool);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract ENSRegistry is IENS {
    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping(bytes32 => Record) records;
    mapping(address => mapping(address => bool)) operators;

    // Permits modifications only by the owner of the specified node.
    modifier authorised(bytes32 node) {
        address nodeOwner = records[node].owner;
        require(nodeOwner == msg.sender || operators[nodeOwner][msg.sender], "Not authorised");
        _;
    }

    constructor() {
        records[0x0].owner = msg.sender;
    }

    function setRecord(bytes32 node, address owner, address resolver, uint64 ttl) external override authorised(node) {
        setOwner(node, owner);
        _setResolverAndTTL(node, resolver, ttl);
    }

    function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external override authorised(node) {
        bytes32 subnode = setSubnodeOwner(node, label, owner);
        _setResolverAndTTL(subnode, resolver, ttl);
    }

    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) public override authorised(node) returns(bytes32) {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        // Directly set owner without calling setOwner to avoid authorised check on subnode
        records[subnode].owner = owner;
        emit Transfer(subnode, owner);
        emit NewOwner(node, label, owner);
        return subnode;
    }

    function setOwner(bytes32 node, address owner) public override authorised(node) {
        emit Transfer(node, owner);
        records[node].owner = owner;
    }

    function setResolver(bytes32 node, address resolver) external override authorised(node) {
        emit NewResolver(node, resolver);
        records[node].resolver = resolver;
    }

    function setTTL(bytes32 node, uint64 ttl) external authorised(node) {
        emit NewTTL(node, ttl);
        records[node].ttl = ttl;
    }

    function setApprovalForAll(address operator, bool approved) external override {
        operators[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function owner(bytes32 node) external view override returns (address) {
        return records[node].owner;
    }

    function resolver(bytes32 node) external view override returns (address) {
        return records[node].resolver;
    }

    function ttl(bytes32 node) external view returns (uint64) {
        return records[node].ttl;
    }

    function recordExists(bytes32 node) external view override returns (bool) {
        return records[node].owner != address(0x0);
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return operators[owner][operator];
    }

    function _setResolverAndTTL(bytes32 node, address resolver, uint64 ttl) internal {
        if(resolver != records[node].resolver) {
            records[node].resolver = resolver;
            emit NewResolver(node, resolver);
        }
        if(ttl != records[node].ttl) {
            records[node].ttl = ttl;
            emit NewTTL(node, ttl);
        }
    }
}
