// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CyberValley.sol";

// TODO: Pad layout after general work finish
contract CyberValleyEventTicket is ERC721, AccessControl {
    using CyberValley for CyberValley.Multihash;

    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
    bytes32 public constant EVENT_MANAGER_ROLE =
        keccak256("EVENT_MANAGER_ROLE");

    uint256 private lastTokenId;
    mapping(uint256 => CyberValley.Multihash) public ticketsMeta;
    mapping(uint256 => bool) public isRedeemed;

    address public eventManagerAddress;

    event TicketMinted(
        uint256 eventId,
        uint256 ticketId,
        address owner,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    );

    event TicketRedeemed(uint256 ticketId);

    constructor(
        string memory name,
        string memory symbol,
        address _master
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, _master);
        _grantRole(MASTER_ROLE, _master);
        _grantRole(STAFF_ROLE, _master);
    }

    modifier onlyEventManager() {
        require(
            hasRole(EVENT_MANAGER_ROLE, msg.sender),
            "Must have event manager role"
        );
        _;
    }

    modifier onlyMaster() {
        require(hasRole(MASTER_ROLE, msg.sender), "Must have master role");
        _;
    }

    modifier onlyStaff() {
        require(hasRole(STAFF_ROLE, msg.sender), "Must have staff role");
        _;
    }

    function setEventManagerAddress(
        address _eventManagerAddress
    ) external {
        require(
            _eventManagerAddress != address(0),
            "Event manager address cannot be zero"
        );
        require(
            eventManagerAddress == address(0),
            "Event manager was already saved"
        );
        _grantRole(EVENT_MANAGER_ROLE, _eventManagerAddress);
    }

    function mint(
        address to,
        uint256 eventId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyEventManager {
        lastTokenId += 1;
        // XXX: Sending to EOAs only for now
        _mint(to, lastTokenId);
        ticketsMeta[lastTokenId] = CyberValley.Multihash(
            digest,
            hashFunction,
            size
        );
        emit TicketMinted(eventId, lastTokenId, to, digest, hashFunction, size);
    }

    function ticketMeta(
        uint256 tokenId
    ) external view returns (bytes32 digest, uint8 hashFunction, uint8 size) {
        _requireOwned(tokenId);
        CyberValley.Multihash storage meta = ticketsMeta[tokenId];
        return (meta.digest, meta.hashFunction, meta.size);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(from == address(0), "Token transfer is disabled");
        super.transferFrom(from, to, tokenId);
    }

    function redeemTicket(uint256 tokenId) external onlyStaff {
        require(!isRedeemed[tokenId], "Token was redeemed already");
        isRedeemed[tokenId] = true;
        emit TicketRedeemed(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
