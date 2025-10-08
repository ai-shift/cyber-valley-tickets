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
    bytes32 public constant LOCAL_PROVIDER_ROLE = keccak256("LOCAL_PROVIDER_ROLE");

    struct EventPlace {
        address provider;
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
        address provider,
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

    address public master;
    // TODO: Make it changeable & add to Event struct
    uint256 public eventRequestPrice;
    uint8 public masterShare;

    EventPlace[] public eventPlaces;
    Event[] public events;
    mapping(address => uint8) public localProviderShare;

    modifier onlyMaster() {
        require(hasRole(MASTER_ROLE, msg.sender), "Must have master role");
        _;
    }

    modifier onlyLocalProvider() {
        require(hasRole(LOCAL_PROVIDER_ROLE, msg.sender), "Must have local provider role");
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
        uint256 _eventRequestPrice,
        uint256 _initialOffest
    ) DateOverlapChecker(_initialOffest) {
        usdtTokenContract = IERC20(_usdtTokenContract);
        eventTicketContract = CyberValleyEventTicket(_eventTicketContract);
        master = _master;
        eventRequestPrice = _eventRequestPrice;

        _grantRole(DEFAULT_ADMIN_ROLE, _master);
        _grantRole(MASTER_ROLE, _master);
    }

    function grantLocalProvider(address eoa, uint8 share) external onlyMaster {
        require(share > 0, "share should be greater than 0");
        require(share <= 100, "share should be less or eqaul to 100 ");
        localProviderShare[eoa] = share;
        _grantRole(LOCAL_PROVIDER_ROLE, eoa);
    }

    function revokeLocalProvider(address eoa) external onlyMaster {
        delete localProviderShare[eoa];
        _revokeRole(LOCAL_PROVIDER_ROLE, eoa);
    }

    function setMasterShare(uint8 share) external onlyMaster {
        require(share > 0, "share should be greater than 0");
        require(share <= 100, "share should be less or equal to 100");
        masterShare = share;
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
    ) external onlyLocalProvider {
        CyberValley.Multihash memory meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });
        EventPlace memory place = EventPlace({
            provider: msg.sender,
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
            msg.sender,
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
    ) external onlyLocalProvider {
        require(eventPlaceId < eventPlaces.length, "eventPlaceId should exist");
        CyberValley.Multihash memory meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });
        EventPlace memory place = EventPlace({
            provider: msg.sender,
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
            msg.sender,
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
                startDate: floorTimestampToDate(startDate),
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
    ) external onlyLocalProvider onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        require(
            evt.status == EventStatus.Submitted,
            "Event status differs from submitted"
        );
        allocateDateRange(
            evt.eventPlaceId,
            evt.startDate,
            calcDaysAfter(evt.startDate, evt.daysAmount)
        );
        evt.status = EventStatus.Approved;
        emit EventStatusChanged(eventId, evt.status);
    }

    function declineEvent(
        uint256 eventId
    ) external onlyLocalProvider onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        require(
            evt.status == EventStatus.Submitted,
            "Event status differs from submitted"
        );
        require(
            usdtTokenContract.transfer(evt.creator, eventRequestPrice),
            "Failed to refund event request"
        );
        evt.status = EventStatus.Declined;
        freeDateRange(
            evt.eventPlaceId,
            evt.startDate,
            calcDaysAfter(evt.startDate, evt.daysAmount)
        );
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
    ) external onlyLocalProvider onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        bool realloc = evt.eventPlaceId != eventPlaceId ||
            evt.startDate != startDate ||
            evt.daysAmount != daysAmount;
        evt.eventPlaceId = eventPlaceId;
        evt.ticketPrice = ticketPrice;
        evt.startDate = floorTimestampToDate(startDate);
        evt.daysAmount = daysAmount;
        evt.meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });
        validateEvent(evt);
        if (realloc) {
            freeDateRange(
                eventPlaceId,
                startDate,
                calcDaysAfter(evt.startDate, evt.daysAmount)
            );
            allocateDateRange(
                eventPlaceId,
                startDate,
                calcDaysAfter(evt.startDate, evt.daysAmount)
            );
        }
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
            floorTimestampToDate(block.timestamp) +
                SECONDS_IN_DAY *
                (place.daysBeforeCancel) <=
                evt.startDate,
            "Not enough time to avoid cancelling"
        );
        // Saves from requests that will allocate a lot of buckets
        // in the `DateOverlapChecker`
        // Written when BUCKET_SIZE == 256
        require(
            evt.startDate - floorTimestampToDate(block.timestamp) <=
                SECONDS_IN_DAY * BUCKET_SIZE,
            "Requested event is too far in the future"
        );
        require(
            checkNoOverlap(
                evt.eventPlaceId,
                evt.startDate,
                calcDaysAfter(evt.startDate, evt.daysAmount)
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
    ) external onlyLocalProvider onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        require(
            evt.status == EventStatus.Approved,
            "Only event in approved state can be closed"
        );
        uint256 eventEndDate = calcDaysAfter(evt.startDate, evt.daysAmount);
        require(
            block.timestamp > eventEndDate,
            "Event has not been finished yet"
        );
        uint256 networth = calcEventNetworth(evt);
        distributeEventFunds(evt.eventPlaceId, networth);
        evt.status = EventStatus.Closed;
        emit EventStatusChanged(eventId, evt.status);
    }

    function cancelEvent(
        uint256 eventId
    ) external onlyLocalProvider onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        require(
            evt.status == EventStatus.Approved,
            "Only event in approved state can be cancelled"
        );
        uint256 networth = calcEventNetworth(evt);
        distributeEventFunds(evt.eventPlaceId, networth);
        evt.status = EventStatus.Cancelled;
        emit EventStatusChanged(eventId, evt.status);
    }

    function calcEventNetworth(
        Event storage evt
    ) internal view returns (uint256) {
        return evt.ticketPrice * evt.customers.length + eventRequestPrice;
    }

    function distributeEventFunds(
        uint256 eventPlaceId,
        uint256 totalAmount
    ) internal {
        address provider = eventPlaces[eventPlaceId].provider;
        uint8 providerSharePercentage = localProviderShare[provider];
        
        uint256 masterAmount = (totalAmount * masterShare) / 100;
        uint256 remainder = totalAmount - masterAmount;
        uint256 providerAmount = (remainder * providerSharePercentage) / 100;
        
        if (masterAmount > 0) {
            require(
                usdtTokenContract.transfer(master, masterAmount),
                "Failed to transfer master share"
            );
        }
        
        if (providerAmount > 0) {
            require(
                usdtTokenContract.transfer(provider, providerAmount),
                "Failed to transfer provider share"
            );
        }
    }

    function floorTimestampToDate(
        uint256 timestamp
    ) internal pure returns (uint256) {
        return (timestamp / SECONDS_IN_DAY) * SECONDS_IN_DAY;
    }

    function calcDaysAfter(
        uint256 date,
        uint256 daysAmount
    ) internal pure returns (uint256) {
        return date + (daysAmount - 1) * SECONDS_IN_DAY;
    }

    function calcDaysBefore(
        uint256 date,
        uint256 daysAmount
    ) internal pure returns (uint256) {
        return date - (daysAmount - 1) * SECONDS_IN_DAY;
    }

    function ensureEventBelongsToProvider(uint256 eventPlaceId) internal view {
        require(
            eventPlaces[eventPlaceId].provider == msg.sender,
           "Given event belongs to another provider"
        );
    }
}
