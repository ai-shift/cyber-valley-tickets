// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CyberValleyEventTicket is ERC721, Ownable {

    uint256 private _tokenIds;

    address public eventManagerAddress;
    mapping(uint256 => uint256) public eventIdByTicketId; // Map ticket ID to event ID

    event TicketMinted(uint256 ticketId, uint256 eventId, address owner);

    constructor(string memory name, string memory symbol, address _eventManagerAddress) ERC721(name, symbol) Ownable(msg.sender) {
        require(_eventManagerAddress != address(0), "Event manager address cannot be zero");
        eventManagerAddress = _eventManagerAddress;
    }

    modifier onlyEventManager() {
        require(msg.sender == eventManagerAddress, "Only event manager can call this function");
        _;
    }

    function setEventManagerAddress(address _eventManagerAddress) external onlyOwner {
        require(_eventManagerAddress != address(0), "Event manager address cannot be zero");
        eventManagerAddress = _eventManagerAddress;
    }

    function mintTicket(uint256 eventId, address to) external onlyEventManager returns (uint256) {
        _tokenIds += 1;

        uint256 newItemId = _tokenIds;
        _mint(to, newItemId);

        eventIdByTicketId[newItemId] = eventId;

        emit TicketMinted(newItemId, eventId, to);

        return newItemId;
    }

    function getEventId(uint256 ticketId) external view returns (uint256) {
        return eventIdByTicketId[ticketId];
    }
}
