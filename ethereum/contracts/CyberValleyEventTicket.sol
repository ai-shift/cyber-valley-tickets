// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CyberValley.sol";

// TODO: Pad layout after general work finish
contract CyberValleyEventTicket is ERC721, Ownable {
    using CyberValley for CyberValley.Multihash;

    uint256 private lastTokenId;
    mapping(uint256 => CyberValley.Multihash) public ticketsMeta;

    address public eventManagerAddress;

    event TicketMinted(
        uint256 eventId,
        uint256 ticketId,
        address owner,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    );

    constructor(
        string memory name,
        string memory symbol,
        address _eventManagerAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(
            _eventManagerAddress != address(0),
            "Event manager address cannot be zero"
        );
        eventManagerAddress = _eventManagerAddress;
    }

    modifier onlyEventManager() {
        require(
            msg.sender == eventManagerAddress,
            "Only event manager can call this function"
        );
        _;
    }

    function setEventManagerAddress(
        address _eventManagerAddress
    ) external onlyOwner {
        require(
            _eventManagerAddress != address(0),
            "Event manager address cannot be zero"
        );
        require(
            eventManagerAddress == address(0),
            "Event manager was already saved"
        );
        eventManagerAddress = _eventManagerAddress;
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
}
