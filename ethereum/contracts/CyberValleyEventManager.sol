// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./CyberValleyEventTicket.sol";
import "./DateOverlapChecker.sol";
import "./CyberValley.sol";

// TODO: Pad layout after general work finish
contract CyberValleyEventManager is AccessControl, DateOverlapChecker {
    using CyberValley for CyberValley.Multihash;

    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");

    struct EventPlace {
        uint16 maxTickets;
        uint16 minTickets;
        uint16 minPrice;
        uint8 daysBeforeCancel;
        uint8 minDays;
        bool available;
        CyberValley.Multihash meta;
    }

    enum EventStatus {
        Submitted,
        Approved,
        Declined,
        Cancelled,
        Closed
    }

    // TODO: Add IPFS multihash
    struct Event {
        address creator;
        uint256 eventPlaceId;
        uint16 ticketPrice;
        uint256 startDate;
        uint16 daysAmount;
        EventStatus status;
        address[] customers;
        CyberValley.Multihash meta;
    }

    event EventPlaceUpdated(
        uint256 eventPlaceId,
        uint16 maxTickets,
        uint16 minTickets,
        uint16 minPrice,
        uint8 daysBeforeCancel,
        uint8 minDays,
        bool available,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    );
    event NewEventRequest(
        uint256 id,
        address creator,
        uint256 eventPlaceId,
        uint16 ticketPrice,
        uint256 startDate,
        uint16 daysAmount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    );
    event EventStatusChanged(uint256 eventId, EventStatus status);
    event EventUpdated(
        uint256 id,
        uint256 eventPlaceId,
        uint16 ticketPrice,
        uint256 startDate,
        uint16 daysAmount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    );
    event EventTicketVerified(uint256 tokenId);

    IERC20 public usdtTokenContract;
    CyberValleyEventTicket public eventTicketContract;

    uint256 public devTeamPercentage;
    address public devTeam;
    uint256 public masterPercentage;
    address public master;
    // TODO: Make it changeable & add to Event struct
    uint256 public eventRequestPrice;

    EventPlace[] public eventPlaces;
    Event[] public events;

    modifier onlyMaster() {
        require(hasRole(MASTER_ROLE, msg.sender), "Must have master role");
        _;
    }

    modifier onlyExistingEvent(uint256 eventId) {
        require(eventId < events.length, "Event with given id does not exist");
        _;
    }

    constructor(
        address _usdtTokenContract,
        address _eventTicketContract,
        address _master,
        uint256 _masterPercentage,
        address _devTeam,
        uint256 _devTeamPercentage,
        uint256 _eventRequestPrice,
        uint256 _initialOffest
    ) DateOverlapChecker(_initialOffest) {
        require(
            _devTeamPercentage + _masterPercentage <= 100,
            "Percentages must be less than 100"
        );

        usdtTokenContract = IERC20(_usdtTokenContract);
        eventTicketContract = CyberValleyEventTicket(_eventTicketContract);
        devTeamPercentage = _devTeamPercentage;
        devTeam = _devTeam;
        masterPercentage = _masterPercentage;
        master = _master;
        eventRequestPrice = _eventRequestPrice;

        _grantRole(DEFAULT_ADMIN_ROLE, _master);
        _grantRole(MASTER_ROLE, _master);
    }

    function createEventPlace(
        uint16 _maxTickets,
        uint16 _minTickets,
        uint16 _minPrice,
        uint8 _daysBeforeCancel,
        uint8 _minDays,
        bool _available,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyMaster {
        CyberValley.Multihash memory meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });
        EventPlace memory place = EventPlace({
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            daysBeforeCancel: _daysBeforeCancel,
            minDays: _minDays,
            available: _available,
            meta: meta
        });
        _validateEventPlace(place);
        eventPlaces.push(place);
        emit EventPlaceUpdated(
            eventPlaces.length - 1,
            _maxTickets,
            _minTickets,
            _minPrice,
            _daysBeforeCancel,
            _minDays,
            _available,
            digest,
            hashFunction,
            size
        );
    }

    function updateEventPlace(
        uint256 eventPlaceId,
        uint16 _maxTickets,
        uint16 _minTickets,
        uint16 _minPrice,
        uint8 _daysBeforeCancel,
        uint8 _minDays,
        bool _available,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyMaster {
        require(eventPlaceId < eventPlaces.length, "eventPlaceId should exist");
        CyberValley.Multihash memory meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });
        EventPlace memory place = EventPlace({
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            daysBeforeCancel: _daysBeforeCancel,
            minDays: _minDays,
            available: _available,
            meta: meta
        });
        _validateEventPlace(place);
        eventPlaces[eventPlaceId] = place;
        emit EventPlaceUpdated(
            eventPlaceId,
            _maxTickets,
            _minTickets,
            _minPrice,
            _daysBeforeCancel,
            _minDays,
            _available,
            digest,
            hashFunction,
            size
        );
    }

    function _validateEventPlace(EventPlace memory eventPlace) internal pure {
        require(
            eventPlace.maxTickets >= eventPlace.minTickets,
            "Max tickets must be greater or equal min tickets"
        );
        require(
            eventPlace.maxTickets > 0 &&
                eventPlace.minTickets > 0 &&
                eventPlace.minPrice > 0 &&
                eventPlace.daysBeforeCancel > 0 &&
                eventPlace.minDays > 0,
            "Values must be greater than zero"
        );
    }

    function submitEventRequest(
        uint256 eventPlaceId,
        uint16 ticketPrice,
        uint256 startDate,
        uint16 daysAmount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external {
        require(
            usdtTokenContract.balanceOf(msg.sender) >= eventRequestPrice,
            "Not enough tokens"
        );
        require(
            usdtTokenContract.allowance(msg.sender, address(this)) >=
                eventRequestPrice,
            "Required amount was not allowed"
        );
        require(
            usdtTokenContract.transferFrom(
                msg.sender,
                address(this),
                eventRequestPrice
            ),
            "Event request payment failed"
        );
        events.push(
            Event({
                creator: msg.sender,
                eventPlaceId: eventPlaceId,
                ticketPrice: ticketPrice,
                startDate: startDate,
                daysAmount: daysAmount,
                status: EventStatus.Submitted,
                customers: new address[](0),
                meta: CyberValley.Multihash({
                    digest: digest,
                    hashFunction: hashFunction,
                    size: size
                })
            })
        );
        validateEvent(events[events.length - 1]);
        emit NewEventRequest(
            events.length - 1,
            msg.sender,
            eventPlaceId,
            ticketPrice,
            startDate,
            daysAmount,
            digest,
            hashFunction,
            size
        );
    }

    function approveEvent(
        uint256 eventId
    ) external onlyMaster onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        require(
            evt.status == EventStatus.Submitted,
            "Event status differs from submitted"
        );
        allocateDateRange(
            evt.eventPlaceId,
            evt.startDate,
            evt.startDate + evt.daysAmount * SECONDS_IN_DAY
        );
        evt.status = EventStatus.Approved;
        emit EventStatusChanged(eventId, evt.status);
    }

    function declineEvent(
        uint256 eventId
    ) external onlyMaster onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        require(
            evt.status == EventStatus.Submitted,
            "Event status differs from submitted"
        );
        require(
            usdtTokenContract.transfer(evt.creator, eventRequestPrice),
            "Failed to refund event request"
        );
        evt.status = EventStatus.Declined;
        emit EventStatusChanged(eventId, evt.status);
    }

    function updateEvent(
        uint256 eventId,
        uint256 eventPlaceId,
        uint16 ticketPrice,
        uint256 startDate,
        uint16 daysAmount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyMaster onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        evt.eventPlaceId = eventPlaceId;
        evt.ticketPrice = ticketPrice;
        evt.startDate = startDate;
        evt.daysAmount = daysAmount;
        evt.meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });
        validateEvent(evt);
        emit EventUpdated(
            eventId,
            eventPlaceId,
            ticketPrice,
            startDate,
            daysAmount,
            digest,
            hashFunction,
            size
        );
    }

    function validateEvent(Event storage evt) internal view {
        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        require(evt.status <= EventStatus.Approved, "Event is not available");
        require(
            place.minPrice <= evt.ticketPrice,
            "Ticket price is less than allowed"
        );
        require(
            place.minDays <= evt.daysAmount,
            "Days amount is less than allowed"
        );
        require(
            block.timestamp + SECONDS_IN_DAY * (place.daysBeforeCancel + 1) <=
                evt.startDate,
            "Not enough time to avoid cancelling"
        );
        // Saves from requests that will allocate a lot of buckets
        // in the `DateOverlapChecker`
        // Written when BUCKET_SIZE == 256
        require(
            evt.startDate - block.timestamp <= SECONDS_IN_DAY * BUCKET_SIZE,
            "Requested event is too far in the future"
        );
        require(
            checkNoOverlap(
                evt.eventPlaceId,
                evt.startDate,
                evt.startDate + evt.daysAmount * SECONDS_IN_DAY
            ),
            "Requested event overlaps with existing"
        );
    }

    function mintTicket(
        uint256 eventId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        require(
            evt.customers.length < eventPlaces[evt.eventPlaceId].maxTickets,
            "Sold out"
        );
        require(
            usdtTokenContract.transferFrom(
                msg.sender,
                address(this),
                evt.ticketPrice
            ),
            "Failed to transfer tokens"
        );
        eventTicketContract.mint(
            msg.sender,
            eventId,
            digest,
            hashFunction,
            size
        );
        evt.customers.push(msg.sender);
    }

    function closeEvent(
        uint256 eventId
    ) external onlyMaster onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        require(
            evt.status == EventStatus.Approved,
            "Only event in approved state can be closed"
        );
        require(
            block.timestamp >= evt.startDate + evt.daysAmount * SECONDS_IN_DAY,
            "Event has not been finished yet"
        );
        uint256 networth = evt.ticketPrice *
            evt.customers.length +
            eventRequestPrice;
        uint256 masterShare = (networth * masterPercentage) / 100;
        uint256 devTeamShare = (networth * devTeamPercentage) / 100;
        require(
            usdtTokenContract.transfer(master, masterShare),
            "Failed to transfer master's share"
        );
        require(
            usdtTokenContract.transfer(devTeam, devTeamShare),
            "Failed to transfer devTeam's share"
        );
        require(
            usdtTokenContract.transfer(
                evt.creator,
                networth - masterShare - devTeamShare
            ),
            "Failed to transfer creator's share"
        );
        evt.status = EventStatus.Closed;
        emit EventStatusChanged(eventId, evt.status);
    }

    function cancelEvent(
        uint256 eventId
    ) external onlyMaster onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        require(
            evt.status == EventStatus.Approved,
            "Only event in approved state can be cancelled"
        );
        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        require(
            evt.startDate - place.daysBeforeCancel * SECONDS_IN_DAY >=
                block.timestamp,
            "Event still have time"
        );
        evt.status = EventStatus.Cancelled;
        for (uint256 idx = 0; idx < evt.customers.length; idx++) {
            require(
                usdtTokenContract.transfer(evt.customers[idx], evt.ticketPrice),
                "Failed to transfer tokens to customer"
            );
        }
        require(
            usdtTokenContract.transfer(evt.creator, eventRequestPrice),
            "Failed to transfer tokens to creator"
        );
        emit EventStatusChanged(eventId, evt.status);
    }
}
