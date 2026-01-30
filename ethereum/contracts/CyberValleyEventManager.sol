// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./CyberValleyEventTicket.sol";
import "./DateOverlapChecker.sol";
import "./CyberValley.sol";
import "./IDynamicRevenueSplitter.sol";

// TODO: Pad layout after general work finish
contract CyberValleyEventManager is AccessControl, DateOverlapChecker {
    using CyberValley for CyberValley.Multihash;

    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    bytes32 public constant LOCAL_PROVIDER_ROLE = keccak256("LOCAL_PROVIDER_ROLE");
    bytes32 public constant VERIFIED_SHAMAN_ROLE = keccak256("VERIFIED_SHAMAN_ROLE");
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    uint256 public constant NO_CATEGORY = type(uint256).max;

    enum EventPlaceStatus {
        Submitted,
        Approved,
        Declined
    }

    struct EventPlace {
        address requester;
        address provider;
        uint16 maxTickets;
        uint16 minTickets;
        uint16 minPrice;
        uint8 daysBeforeCancel;
        uint8 minDays;
        bool available;
        EventPlaceStatus status;
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
    struct TicketCategory {
        string name;
        uint256 eventId;
        uint16 discountPercentage;
        uint16 quota;
        bool hasQuota;
        uint16 sold;
    }

    struct Event {
        address creator;
        uint256 eventPlaceId;
        uint16 ticketPrice;
        uint256 startDate;
        uint16 daysAmount;
        EventStatus status;
        address[] customers;
        CyberValley.Multihash meta;
        uint256 networth;
        uint256 totalCategoryQuota; // Gas-efficient tracking of category quotas
        uint256 noCategorySold; // Track NO_CATEGORY tickets sold
    }

    event NewEventPlaceRequest(
        uint256 id,
        address requester,
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
    event EventPlaceUpdated(
        address provider,
        uint256 eventPlaceId,
        uint16 maxTickets,
        uint16 minTickets,
        uint16 minPrice,
        uint8 daysBeforeCancel,
        uint8 minDays,
        bool available,
        EventPlaceStatus status,
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

    event TicketCategoryCreated(
        uint256 categoryId,
        uint256 indexed eventId,
        string name,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota
    );
    event TicketCategoryUpdated(
        uint256 categoryId,
        uint256 indexed eventId,
        string name,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota
    );

    IERC20 public usdtTokenContract;
    CyberValleyEventTicket public eventTicketContract;

    address public master;
    uint256 public eventRequestPrice;
    address public revenueSplitter;

    EventPlace[] public eventPlaces;
    Event[] public events;
    TicketCategory[] public categories;
    mapping(uint256 => uint256[]) public categoryCounters;
    mapping(uint256 => uint16[]) public ticketPrices;

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
        _setRoleAdmin(VERIFIED_SHAMAN_ROLE, BACKEND_ROLE);
    }

    function grantLocalProvider(address eoa) external onlyRole(MASTER_ROLE) {
        _grantRole(LOCAL_PROVIDER_ROLE, eoa);
    }

    function revokeLocalProvider(address eoa) external onlyRole(MASTER_ROLE) {
        _revokeRole(LOCAL_PROVIDER_ROLE, eoa);
    }

    function revokeVerifiedShaman(address eoa) external onlyRole(LOCAL_PROVIDER_ROLE) {
        _revokeRole(VERIFIED_SHAMAN_ROLE, eoa);
    }

    function setRevenueSplitter(address _splitter) external onlyRole(MASTER_ROLE) {
        require(_splitter != address(0), "Splitter address cannot be zero");
        revenueSplitter = _splitter;
    }

    function submitEventPlaceRequest(
        uint16 _maxTickets,
        uint16 _minTickets,
        uint16 _minPrice,
        uint8 _daysBeforeCancel,
        uint8 _minDays,
        bool _available,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external {
        bool isLocalProvider = hasRole(LOCAL_PROVIDER_ROLE, msg.sender);
	require(isLocalProvider || hasRole(VERIFIED_SHAMAN_ROLE, msg.sender), "access denied");

        eventPlaces.push(EventPlace({
            requester: msg.sender,
            provider: isLocalProvider ? msg.sender : address(0),
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            daysBeforeCancel: _daysBeforeCancel,
            minDays: _minDays,
            available: _available,
            status: isLocalProvider ? EventPlaceStatus.Approved : EventPlaceStatus.Submitted,
            meta: CyberValley.Multihash({
                digest: digest,
                hashFunction: hashFunction,
                size: size
            })
        }));

        uint256 eventPlaceId = eventPlaces.length - 1;
        _validateEventPlace(eventPlaces[eventPlaceId]);

        if (isLocalProvider) {
            emit EventPlaceUpdated(
                msg.sender,
                eventPlaceId,
                _maxTickets,
                _minTickets,
                _minPrice,
                _daysBeforeCancel,
                _minDays,
                _available,
                EventPlaceStatus.Approved,
                digest,
                hashFunction,
                size
            );
        } else {
            emit NewEventPlaceRequest(
                eventPlaceId,
                msg.sender,
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
    }

    function approveEventPlace(
        uint256 eventPlaceId
    ) external onlyRole(LOCAL_PROVIDER_ROLE) {
        require(eventPlaceId < eventPlaces.length, "EventPlace does not exist");
        EventPlace storage place = eventPlaces[eventPlaceId];
        require(
            place.status == EventPlaceStatus.Submitted,
            "EventPlace status differs from submitted"
        );
        place.status = EventPlaceStatus.Approved;
        place.provider = msg.sender;
        emit EventPlaceUpdated(
            msg.sender,
            eventPlaceId,
            place.maxTickets,
            place.minTickets,
            place.minPrice,
            place.daysBeforeCancel,
            place.minDays,
            place.available,
            place.status,
            place.meta.digest,
            place.meta.hashFunction,
            place.meta.size
        );
    }

    function declineEventPlace(
        uint256 eventPlaceId
    ) external onlyRole(LOCAL_PROVIDER_ROLE) {
        require(eventPlaceId < eventPlaces.length, "EventPlace does not exist");
        EventPlace storage place = eventPlaces[eventPlaceId];
        require(
            place.status == EventPlaceStatus.Submitted,
            "EventPlace status differs from submitted"
        );
        place.status = EventPlaceStatus.Declined;
        // No event emitted for declined places
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
    ) external onlyRole(LOCAL_PROVIDER_ROLE) {
        require(eventPlaceId < eventPlaces.length, "eventPlaceId should exist");
        EventPlace storage place = eventPlaces[eventPlaceId];
        require(
            place.provider == msg.sender,
            "Given event place belongs to another provider"
        );
        require(
            place.status == EventPlaceStatus.Approved,
            "EventPlace must be approved to be updated"
        );

        place.maxTickets = _maxTickets;
        place.minTickets = _minTickets;
        place.minPrice = _minPrice;
        place.daysBeforeCancel = _daysBeforeCancel;
        place.minDays = _minDays;
        place.available = _available;
        place.meta = CyberValley.Multihash({
            digest: digest,
            hashFunction: hashFunction,
            size: size
        });

        _validateEventPlace(place);
        emit EventPlaceUpdated(
            msg.sender,
            eventPlaceId,
            _maxTickets,
            _minTickets,
            _minPrice,
            _daysBeforeCancel,
            _minDays,
            _available,
            place.status,
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
                }),
                networth: eventRequestPrice,
                totalCategoryQuota: 0,
                noCategorySold: 0
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
    ) external onlyRole(LOCAL_PROVIDER_ROLE) onlyExistingEvent(eventId) {
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
    ) external onlyRole(LOCAL_PROVIDER_ROLE) onlyExistingEvent(eventId) {
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
    ) external onlyRole(LOCAL_PROVIDER_ROLE) onlyExistingEvent(eventId) {
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
            place.status == EventPlaceStatus.Approved,
            "EventPlace must be approved"
        );
        require(
            place.available,
            "EventPlace is not available"
        );
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
        _mintTicketInternal(eventId, NO_CATEGORY, digest, hashFunction, size);
    }

    function mintTicket(
        uint256 eventId,
        uint256 categoryId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyExistingEvent(eventId) {
        _mintTicketInternal(eventId, categoryId, digest, hashFunction, size);
    }

    function _mintTicketInternal(
        uint256 eventId,
        uint256 categoryId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) internal onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        require(evt.status == EventStatus.Approved, "Event is not approved");

        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        uint16 price = evt.ticketPrice;

        if (categoryId != NO_CATEGORY) {
            require(categoryId < categories.length, "Category does not exist");
            TicketCategory storage category = categories[categoryId];
            require(category.eventId == eventId, "Category does not belong to this event");

            if (category.hasQuota) {
                require(category.sold < category.quota, "Category quota exceeded");
                category.sold++;
            }
            price = applyDiscount(evt.ticketPrice, category.discountPercentage);
        } else {
            // Gas-efficient NO_CATEGORY validation
            // NO_CATEGORY tickets available = maxTickets - totalCategoryQuota - noCategorySold
            require(evt.noCategorySold < place.maxTickets - evt.totalCategoryQuota,
                "No tickets available without category");
            evt.noCategorySold++;
        }

        require(
            usdtTokenContract.transferFrom(
                msg.sender,
                address(this),
                price
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
        ticketPrices[eventId].push(price);
        evt.networth += price;
    }

    function applyDiscount(uint16 originalPrice, uint16 discountPercentage) internal pure returns (uint16) {
        if (discountPercentage == 0) {
            return originalPrice;
        }
        uint256 price = uint256(originalPrice);
        uint256 discount = (price * uint256(discountPercentage)) / 10000;
        return uint16(price - discount);
    }

    function closeEvent(
        uint256 eventId
    ) external onlyRole(LOCAL_PROVIDER_ROLE) onlyExistingEvent(eventId) {
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
        distributeEventFunds(eventId, evt.networth);
        evt.status = EventStatus.Closed;
        emit EventStatusChanged(eventId, evt.status);
    }

    function cancelEvent(
        uint256 eventId
    ) external onlyRole(LOCAL_PROVIDER_ROLE) onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        require(
            evt.status == EventStatus.Approved,
            "Only event in approved state can be cancelled"
        );

        uint16[] storage prices = ticketPrices[eventId];
        for (uint256 i = 0; i < evt.customers.length; i++) {
            uint256 refundAmount = evt.ticketPrice;
            if (i < prices.length) {
                refundAmount = prices[i];
            }
            require(
                usdtTokenContract.transfer(evt.customers[i], refundAmount),
                "Failed to refund customer"
            );
        }

        require(
            usdtTokenContract.transfer(msg.sender, eventRequestPrice),
            "Failed to transfer provider payment"
        );

        evt.networth = 0;
        evt.status = EventStatus.Cancelled;
        emit EventStatusChanged(eventId, evt.status);
    }

    // TODO: Publish event with funds distribution
    function distributeEventFunds(
        uint256 eventId,
        uint256 totalAmount
    ) internal {
        require(revenueSplitter != address(0), "Revenue splitter not set");
        usdtTokenContract.approve(revenueSplitter, totalAmount);
        IDynamicRevenueSplitter(revenueSplitter).distributeRevenue(totalAmount, eventId);
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

    function _eventHasUnlimitedCategory(uint256 eventId) internal view returns (bool) {
        uint256[] storage eventCategories = categoryCounters[eventId];
        for (uint256 i = 0; i < eventCategories.length; i++) {
            if (!categories[eventCategories[i]].hasQuota) {
                return true;
            }
        }
        return false;
    }

    function ensureEventBelongsToProvider(uint256 eventPlaceId) internal view {
        require(
            eventPlaces[eventPlaceId].provider == msg.sender,
           "Given event belongs to another provider"
        );
    }

    function createCategory(
        uint256 eventId,
        string memory name,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota
    ) external onlyRole(VERIFIED_SHAMAN_ROLE) {
        require(eventId < events.length, "Event does not exist");
        Event storage evt = events[eventId];
        require(evt.status == EventStatus.Submitted, "Event must be in submitted state");
        require(discountPercentage <= 10000, "Discount too high");

        // Gas-efficient quota validation using stored totalCategoryQuota
        if (hasQuota) {
            require(quota > 0, "Quota must be greater than 0");
            EventPlace storage place = eventPlaces[evt.eventPlaceId];
            require(quota <= place.maxTickets, "Quota exceeds event capacity");
            require(evt.totalCategoryQuota + quota <= place.maxTickets,
                "Total category quotas exceed event capacity");
            // Update stored total
            evt.totalCategoryQuota += quota;
        } else {
            require(
                !_eventHasUnlimitedCategory(eventId),
                "Only one unlimited quota category allowed"
            );
        }

        categories.push(TicketCategory({
            name: name,
            eventId: eventId,
            discountPercentage: discountPercentage,
            quota: quota,
            hasQuota: hasQuota,
            sold: 0
        }));

        uint256 categoryId = categories.length - 1;
        categoryCounters[eventId].push(categoryId);

        emit TicketCategoryCreated(
            categoryId,
            eventId,
            name,
            discountPercentage,
            quota,
            hasQuota
        );
    }

    function updateCategory(
        uint256 categoryId,
        string memory name,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota
    ) external onlyRole(LOCAL_PROVIDER_ROLE) {
        require(categoryId < categories.length, "Category does not exist");
        require(discountPercentage <= 10000, "Discount too high");
        TicketCategory storage category = categories[categoryId];

        Event storage evt = events[category.eventId];
        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        require(
            place.provider == msg.sender,
            "Only the local provider of the event can update categories"
        );
        require(evt.status == EventStatus.Submitted, "Event must be in submitted state");

        // Gas-efficient quota validation using stored totalCategoryQuota
        if (hasQuota) {
            require(quota > 0, "Quota must be greater than 0");
            require(quota >= category.sold, "Quota cannot be less than tickets already sold");
            require(quota <= place.maxTickets, "Quota exceeds event capacity");

            // Calculate new total: subtract old quota, add new quota
            uint256 newTotalQuota = evt.totalCategoryQuota;
            if (category.hasQuota) {
                newTotalQuota -= category.quota;
            }
            newTotalQuota += quota;
            require(newTotalQuota <= place.maxTickets,
                "Total category quotas exceed event capacity");

            // Update stored total
            evt.totalCategoryQuota = newTotalQuota;
        } else {
            require(category.hasQuota == false, "Cannot change from limited to unlimited quota");
        }

        category.name = name;
        category.discountPercentage = discountPercentage;
        category.quota = quota;
        category.hasQuota = hasQuota;

        emit TicketCategoryUpdated(
            categoryId,
            category.eventId,
            name,
            discountPercentage,
            quota,
            hasQuota
        );
    }

    function getCategory(uint256 categoryId) external view returns (
        string memory name,
        uint256 eventId,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota,
        uint16 sold
    ) {
        require(categoryId < categories.length, "Category does not exist");
        TicketCategory storage category = categories[categoryId];
        return (category.name, category.eventId, category.discountPercentage, category.quota, category.hasQuota, category.sold);
    }

    function getCategoriesForEvent(uint256 eventId) external view returns (uint256[] memory) {
        return categoryCounters[eventId];
    }
}
