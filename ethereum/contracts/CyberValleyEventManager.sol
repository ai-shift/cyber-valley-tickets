// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./EventTicket.sol";

contract CyberValleyEventManager is AccessControl {
    using Strings for uint256;

    // Roles
    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");

    // Structs
    struct EventRequest {
        address creator;
        uint256 eventPlaceId;
        uint256 startTimestamp;
        uint256 ticketPrice;
    }

    struct EventPlace {
        uint16 maxTickets;
        uint16 minTickets;
        uint16 minPrice;
        uint8 minDays;
    }

    struct Event {
        address creator;
        string eventDataCID;
        uint256 balance;
        bool cancelled;
        bool closed;
        uint256 ticketPrice;
    }

    // State variables
    mapping(uint256 => Event) public events;
    mapping(uint256 => EventPlace) public eventPlaces;
    mapping(uint256 => EventRequest) public eventRequests;

    IERC20 public usdtTokenContract;
    EventTicket public cyberValleyTicketContract;

    uint256 public devTeamPercentage;
    uint256 public masterPercentage;

    uint256 public nextEventId;
    uint256 public nextEventPlaceId;
    uint256 public nextEventRequestId;

    // Events
    event NewEventPlaceAvailable(uint256 eventPlaceId, uint16 maxTickets, uint16 minTickets, uint16 minPrice, uint8 minDays);
    event EventPlaceUpdated(uint256 eventPlaceId, uint16 maxTickets, uint16 minTickets, uint16 minPrice, uint8 minDays);
    event NewEventAvailable(uint256 eventId, address creator, string eventDataCID);
    event EventWasUpdated(uint256 eventId, string eventDataCID);
    event EventCancelled(uint256 eventId);
    event EventClosed(uint256 eventId);
    event EventRequestSubmitted(uint256 eventRequestId, address creator, uint256 eventPlaceId, uint256 startTimestamp);
    event EventRequestApproved(uint256 eventRequestId, uint256 eventId);
    event EventRequestDeclined(uint256 eventRequestId);
    event TicketBought(uint256 eventId, address buyer, uint256 ticketId);

    // Modifiers
    modifier onlyMaster() {
        require(hasRole(MASTER_ROLE, _msgSender()), "Must have master role");
        _;
    }

    // Constructor
    constructor(address _usdtTokenContract, uint256 _devTeamPercentage, uint256 _masterPercentage) {
        require(_devTeamPercentage + _masterPercentage <= 100, "Percentages must be less than 100");

        usdtTokenContract = IERC20(_usdtTokenContract);
        devTeamPercentage = _devTeamPercentage;
        masterPercentage = _masterPercentage;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MASTER_ROLE, _msgSender());
    }

    function setCyberValleyTicketContract(address _cyberValleyTicketContract) external onlyMaster {
        cyberValleyTicketContract = EventTicket(_cyberValleyTicketContract);
    }

    // Event Place Management
    function createEventPlace(uint16 _maxTickets, uint16 _minTickets, uint16 _minPrice, uint8 _minDays) external onlyMaster {
        require(_maxTickets > 0 && _minTickets > 0 && _minPrice > 0 && _minDays > 0, "Values must be greater than zero");
        require(_maxTickets >= _minTickets, "Max tickets must be greater or equal min tickets");

        eventPlaces[nextEventPlaceId] = EventPlace({
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            minDays: _minDays
        });

        emit NewEventPlaceAvailable(nextEventPlaceId, _maxTickets, _minTickets, _minPrice, _minDays);
        nextEventPlaceId++;
    }

    function updateEventPlace(uint256 _eventPlaceId, uint16 _maxTickets, uint16 _minTickets, uint16 _minPrice, uint8 _minDays) external onlyMaster {
        require(_maxTickets > 0 && _minTickets > 0 && _minPrice > 0 && _minDays > 0, "Values must be greater than zero");
        require(_maxTickets >= _minTickets, "Max tickets must be greater or equal min tickets");
        require(eventPlaces[_eventPlaceId].maxTickets > 0, "Event place doesn't exist");

        // Add logic to prevent changing if there's an event

        eventPlaces[_eventPlaceId] = EventPlace({
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            minDays: _minDays
        });

        emit EventPlaceUpdated(_eventPlaceId, _maxTickets, _minTickets, _minPrice, _minDays);
    }

    // Event Request Management
    function submitEventRequest(uint256 _eventPlaceId, uint256 _startTimestamp, uint256 _ticketPrice) external {
        require(eventPlaces[_eventPlaceId].maxTickets > 0, "Event place doesn't exist");
        require(_startTimestamp > block.timestamp, "Start timestamp must be in the future");
        require(_ticketPrice >= eventPlaces[_eventPlaceId].minPrice, "Ticket price is too low");

        eventRequests[nextEventRequestId] = EventRequest({
            creator: _msgSender(),
            eventPlaceId: _eventPlaceId,
            startTimestamp: _startTimestamp,
            ticketPrice: _ticketPrice
        });

        emit EventRequestSubmitted(nextEventRequestId, _msgSender(), _eventPlaceId, _startTimestamp);
        nextEventRequestId++;
    }

    function approveEventRequest(uint256 _eventRequestId, string memory _eventDataCID) external onlyMaster {
        require(eventRequests[_eventRequestId].creator != address(0), "Event request doesn't exist");

        EventRequest memory request = eventRequests[_eventRequestId];
        require(events[nextEventId].creator == address(0), "Event already exists");

        events[nextEventId] = Event({
            creator: request.creator,
            eventDataCID: _eventDataCID,
            balance: 0,
            cancelled: false,
            closed: false,
            ticketPrice: request.ticketPrice
        });

        emit NewEventAvailable(nextEventId, request.creator, _eventDataCID);
        emit EventRequestApproved(_eventRequestId, nextEventId);

        nextEventId++;

        delete eventRequests[_eventRequestId];
    }

    function declineEventRequest(uint256 _eventRequestId) external onlyMaster {
        require(eventRequests[_eventRequestId].creator != address(0), "Event request doesn't exist");
        delete eventRequests[_eventRequestId];
        emit EventRequestDeclined(_eventRequestId);
    }

    // Event Management
    function updateEvent(uint256 _eventId, string memory _eventDataCID) external onlyMaster {
        require(events[_eventId].creator != address(0), "Event doesn't exist");
        require(!events[_eventId].cancelled, "Event is cancelled");
        require(!events[_eventId].closed, "Event is closed");

        events[_eventId].eventDataCID = _eventDataCID;
        emit EventWasUpdated(_eventId, _eventDataCID);
    }

    function cancelEvent(uint256 _eventId) external onlyMaster {
        require(events[_eventId].creator != address(0), "Event doesn't exist");
        require(!events[_eventId].cancelled, "Event is already cancelled");
        require(!events[_eventId].closed, "Event is closed");

        events[_eventId].cancelled = true;
        emit EventCancelled(_eventId);

        // TODO: Refund logic
    }

    function closeEvent(uint256 _eventId) external onlyMaster {
        require(events[_eventId].creator != address(0), "Event doesn't exist");
        require(!events[_eventId].cancelled, "Event is cancelled");
        require(!events[_eventId].closed, "Event is already closed");

        events[_eventId].closed = true;
        emit EventClosed(_eventId);

        // Distribute funds
        uint256 balance = events[_eventId].balance;
        address creator = events[_eventId].creator;

        uint256 devTeamCut = (balance * devTeamPercentage) / 100;
        uint256 masterCut = (balance * masterPercentage) / 100;
        uint256 creatorCut = balance - devTeamCut - masterCut;

        events[_eventId].balance = 0;

        (bool success1, ) = address(this).call{value: devTeamCut}("");
        require(success1, "Dev team transfer failed.");

        (bool success2, ) = address(this).call{value: masterCut}("");
        require(success2, "Master transfer failed.");

        (bool success3, ) = creator.call{value: creatorCut}("");
        require(success3, "Creator transfer failed.");
    }

    // Ticket Management
    function buyTicket(uint256 _eventId) external {
        require(events[_eventId].creator != address(0), "Event doesn't exist");
        require(!events[_eventId].cancelled, "Event is cancelled");
        require(!events[_eventId].closed, "Event is closed");

        uint256 ticketPrice = events[_eventId].ticketPrice;

        // Transfer USDT
        usdtTokenContract.transferFrom(_msgSender(), address(this), ticketPrice);

        // Mint ticket
        uint256 ticketId = cyberValleyTicketContract.mintTicket(_eventId, _msgSender());

        // Update event balance
        events[_eventId].balance += ticketPrice;

        emit TicketBought(_eventId, _msgSender(), ticketId);
    }

    function verifyTicket(uint256 _eventId, uint256 _ticketId) external view onlyRole(STAFF_ROLE) returns (bool) {
        address ticketOwner = cyberValleyTicketContract.ownerOf(_ticketId);
        return (cyberValleyTicketContract.getEventId(_ticketId) == _eventId && ticketOwner != address(0));
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
