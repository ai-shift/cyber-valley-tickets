// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CyberValleyEventTicket.sol";
import "./DateOverlapChecker.sol";
import "./CyberValley.sol";
import "./IDynamicRevenueSplitter.sol";
import "./IReferralRewards.sol";

// TODO: Pad layout after general work finish
contract CyberValleyEventManager is AccessControl, DateOverlapChecker {
    using CyberValley for CyberValley.Multihash;

    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    bytes32 public constant LOCAL_PROVIDER_ROLE = keccak256("LOCAL_PROVIDER_ROLE");
    bytes32 public constant VERIFIED_SHAMAN_ROLE = keccak256("VERIFIED_SHAMAN_ROLE");
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

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
        uint256 eventDepositSize;
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

    // Input struct for creating categories during event submission
    struct CategoryInput {
        string name;
        uint16 discountPercentage;
        uint16 quota;
        bool hasQuota;
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
        uint8 size,
        uint256 eventDepositSize
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
    event ReferralRewardsUpdated(address referralRewards);

    IERC20 public usdtTokenContract;
    CyberValleyEventTicket public eventTicketContract;

    address public master;
    uint256 public eventRequestPrice;
    address public revenueSplitter;
    IReferralRewards public referralRewards;

    EventPlace[] public eventPlaces;
    Event[] public events;
    TicketCategory[] public categories;
    mapping(uint256 => uint256[]) public categoryCounters;
    // NOTE: `ticketPrices` was removed because it was written but never read anywhere.

    modifier onlyExistingEvent(uint256 eventId) {
        require(eventId < events.length, "Event with given id does not exist");
        _;
    }

    /**
     * @notice Check if a place has any active events (submitted or approved status)
     * @param eventPlaceId The ID of the event place
     * @return true if there are active events at this place
     */
    function _hasActiveEvents(uint256 eventPlaceId) internal view returns (bool) {
        for (uint256 i = 0; i < events.length; i++) {
            if (events[i].eventPlaceId == eventPlaceId) {
                if (events[i].status == EventStatus.Submitted || events[i].status == EventStatus.Approved) {
                    return true;
                }
            }
        }
        return false;
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
        _grantRole(LOCAL_PROVIDER_ROLE, _master);
        _setRoleAdmin(VERIFIED_SHAMAN_ROLE, BACKEND_ROLE);
    }

    function setReferralRewards(address _referralRewards) external onlyRole(MASTER_ROLE) {
        referralRewards = IReferralRewards(_referralRewards);
        emit ReferralRewardsUpdated(_referralRewards);
    }

    /**
     * @notice Grants local provider role and sets their bps share in RevenueSplitter
     * @param eoa The address to grant LOCAL_PROVIDER_ROLE to
     * @param bps The basis points (0-8500) this provider receives from each distribution.
     *           Applied after fixed bps (CyberiaDAO 10% + CVE PT PMA 5%) and before 
     *           profile recipients. Provider cannot add themselves to distribution profiles.
     */
    function grantLocalProvider(address eoa, uint256 bps) external onlyRole(MASTER_ROLE) {
        require(eoa != address(0), "Local provider cannot be zero address");
        require(revenueSplitter != address(0), "Revenue splitter not set");
        _grantRole(LOCAL_PROVIDER_ROLE, eoa);
        // Bps validation happens in RevenueSplitter. Provider gets bps automatically
        // and cannot add themselves to distribution profiles.
        IDynamicRevenueSplitter(revenueSplitter).grantProfileManager(eoa, bps);
    }

    function revokeLocalProvider(address eoa) external onlyRole(MASTER_ROLE) {
        // Transfer all EventPlaces owned by the LocalProvider to Master
        for (uint256 i = 0; i < eventPlaces.length; i++) {
            if (eventPlaces[i].provider == eoa) {
                eventPlaces[i].provider = master;

                // Emit EventPlaceUpdated event for the transfer
                emit EventPlaceUpdated(
                    master,
                    i,
                    eventPlaces[i].maxTickets,
                    eventPlaces[i].minTickets,
                    eventPlaces[i].minPrice,
                    eventPlaces[i].daysBeforeCancel,
                    eventPlaces[i].minDays,
                    eventPlaces[i].available,
                    eventPlaces[i].status,
                    eventPlaces[i].meta.digest,
                    eventPlaces[i].meta.hashFunction,
                    eventPlaces[i].meta.size,
                    eventPlaces[i].eventDepositSize
                );
            }
        }

        // Transfer all profile ownership from revoked provider to master
        IDynamicRevenueSplitter(revenueSplitter).transferAllProfiles(eoa, master);

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
        uint8 size,
        uint256 _eventDepositSize
    ) external {
        bool isLocalProvider = hasRole(LOCAL_PROVIDER_ROLE, msg.sender);
	require(isLocalProvider || hasRole(VERIFIED_SHAMAN_ROLE, msg.sender), "access denied");

        // If local provider is creating, deposit must be > 0
        // If shaman is requesting, deposit can be 0 (will be set during approval)
        if (isLocalProvider) {
            require(_eventDepositSize > 0, "Deposit must be greater than zero");
        }

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
            }),
            eventDepositSize: _eventDepositSize
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
                size,
                _eventDepositSize
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
        uint256 eventPlaceId,
        uint256 _eventDepositSize
    ) external onlyRole(LOCAL_PROVIDER_ROLE) {
        require(eventPlaceId < eventPlaces.length, "EventPlace does not exist");
        require(_eventDepositSize > 0, "Deposit must be greater than zero");
        EventPlace storage place = eventPlaces[eventPlaceId];
        require(
            place.status == EventPlaceStatus.Submitted,
            "EventPlace status differs from submitted"
        );
        place.status = EventPlaceStatus.Approved;
        place.provider = msg.sender;
        place.eventDepositSize = _eventDepositSize;
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
            place.meta.size,
            place.eventDepositSize
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
        uint8 size,
        uint256 _eventDepositSize
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

        // Only allow deposit change if there are no active events
        if (_eventDepositSize != place.eventDepositSize) {
            require(
                !_hasActiveEvents(eventPlaceId),
                "Cannot change deposit while there are active events"
            );
            require(_eventDepositSize > 0, "Deposit must be greater than zero");
            place.eventDepositSize = _eventDepositSize;
        }

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
            size,
            place.eventDepositSize
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
        uint8 size,
        CategoryInput[] calldata categoriesInput
    ) external {
        require(eventPlaceId < eventPlaces.length, "EventPlace does not exist");
        EventPlace storage place = eventPlaces[eventPlaceId];
        require(
            place.eventDepositSize > 0,
            "EventPlace deposit must be set"
        );
        require(
            usdtTokenContract.balanceOf(msg.sender) >= place.eventDepositSize,
            "Not enough tokens"
        );
        require(
            usdtTokenContract.allowance(msg.sender, address(this)) >=
                place.eventDepositSize,
            "Required amount was not allowed"
        );
        require(
            usdtTokenContract.transferFrom(
                msg.sender,
                address(this),
                place.eventDepositSize
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
                networth: 0,
                totalCategoryQuota: 0
            })
        );
        uint256 eventId = events.length - 1;
        validateEvent(events[eventId]);

        // Create categories atomically with the event
        require(categoriesInput.length > 0, "At least one category is required");
        for (uint256 i = 0; i < categoriesInput.length; i++) {
            CategoryInput memory cat = categoriesInput[i];
            _createCategoryForEvent(
                eventId,
                cat.name,
                cat.discountPercentage,
                cat.quota,
                cat.hasQuota
            );
        }

        // Validate that categories are within boundaries
        Event storage newEvent = events[eventId];
        EventPlace storage eventPlace = eventPlaces[newEvent.eventPlaceId];
        bool hasUnlimited = _eventHasUnlimitedCategory(eventId);
        if (!hasUnlimited) {
            require(
                newEvent.totalCategoryQuota >= eventPlace.minTickets,
                "Total tickets must be at least minTickets"
            );
            require(
                newEvent.totalCategoryQuota <= eventPlace.maxTickets,
                "Total tickets cannot exceed maxTickets"
            );
        }

        emit NewEventRequest(
            eventId,
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
        uint256 eventId,
        uint256 distributionProfileId
    ) external onlyRole(LOCAL_PROVIDER_ROLE) onlyExistingEvent(eventId) {
        Event storage evt = events[eventId];
        ensureEventBelongsToProvider(evt.eventPlaceId);
        require(
            evt.status == EventStatus.Submitted,
            "Event status differs from submitted"
        );
        require(
            categoryCounters[eventId].length > 0,
            "Event must have at least one category"
        );

        // Validate profile ownership - caller must own the profile
        require(
            IDynamicRevenueSplitter(revenueSplitter).isProfileOwner(
                distributionProfileId,
                msg.sender
            ),
            "Caller must own the distribution profile"
        );

        // Set event profile in revenue splitter
        IDynamicRevenueSplitter(revenueSplitter).setEventProfile(
            eventId,
            distributionProfileId
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
        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        require(
            usdtTokenContract.transfer(evt.creator, place.eventDepositSize),
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
        
        // Capture old values BEFORE any mutations
        uint256 oldEventPlaceId = evt.eventPlaceId;
        uint256 oldStartDate = evt.startDate;
        uint256 oldDaysAmount = evt.daysAmount;
        
        bool realloc = oldEventPlaceId != eventPlaceId ||
            oldStartDate != startDate ||
            oldDaysAmount != daysAmount;
        
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
            // Free the OLD date range from the OLD place
            freeDateRange(
                oldEventPlaceId,
                oldStartDate,
                calcDaysAfter(oldStartDate, oldDaysAmount)
            );
            // Allocate the NEW date range to the NEW place
            allocateDateRange(
                eventPlaceId,
                evt.startDate,
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
        uint256 categoryId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size,
        address referrer
    ) external onlyExistingEvent(eventId) {
        _mintTicketInternal(eventId, categoryId, 1, digest, hashFunction, size, referrer);
    }

    function mintTickets(
        uint256 eventId,
        uint256 categoryId,
        uint256 amount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size,
        address referrer
    ) external onlyExistingEvent(eventId) {
        _mintTicketInternal(eventId, categoryId, amount, digest, hashFunction, size, referrer);
    }

    function _mintTicketInternal(
        uint256 eventId,
        uint256 categoryId,
        uint256 amount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size,
        address referrer
    ) internal onlyExistingEvent(eventId) {
        require(amount > 0, "Amount must be greater than 0");

        Event storage evt = events[eventId];
        require(evt.status == EventStatus.Approved, "Event is not approved");

        // Category is required
        require(categoryId < categories.length, "Category does not exist");
        TicketCategory storage category = categories[categoryId];
        require(category.eventId == eventId, "Category does not belong to this event");

        if (category.hasQuota) {
            require(category.sold + uint16(amount) <= category.quota, "Category quota exceeded");
            category.sold += uint16(amount);
        }
        uint16 price = applyDiscount(evt.ticketPrice, category.discountPercentage);
        uint256 totalPrice = uint256(price) * amount;

        require(
            usdtTokenContract.transferFrom(
                msg.sender,
                address(this),
                totalPrice
            ),
            "Failed to transfer tokens"
        );

        // Referral payouts are taken out of event revenue (reduces `evt.networth`).
        uint256 referralPaid = 0;
        if (address(referralRewards) != address(0)) {
            address safeReferrer = referrer == msg.sender ? address(0) : referrer;

            (address[3] memory recipients, uint256[3] memory bonuses, uint256 paid) =
                referralRewards.processPurchase(msg.sender, safeReferrer, totalPrice);
            referralPaid = paid;

            for (uint256 i = 0; i < 3; i++) {
                if (recipients[i] != address(0) && bonuses[i] > 0) {
                    require(
                        usdtTokenContract.transfer(recipients[i], bonuses[i]),
                        "Failed to pay referral"
                    );
                }
            }
        }

        eventTicketContract.mintBatch(
            msg.sender,
            eventId,
            categoryId,
            amount,
            digest,
            hashFunction,
            size,
            referrer,
            totalPrice
        );
        evt.customers.push(msg.sender);
        evt.networth += (totalPrice - referralPaid);
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
        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        // Return deposit to creator
        require(
            usdtTokenContract.transfer(evt.creator, place.eventDepositSize),
            "Failed to return deposit to creator"
        );
        // Distribute ticket revenue only if there is revenue
        if (evt.networth > 0) {
            distributeEventFunds(eventId, evt.networth);
        }
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

        EventPlace storage place = eventPlaces[evt.eventPlaceId];
        
        // Deposit goes to shaman (event creator)
        if (place.eventDepositSize > 0) {
            require(
                usdtTokenContract.transfer(evt.creator, place.eventDepositSize),
                "Failed to refund deposit to creator"
            );
        }
        
        // Ticket revenue goes to local provider
        if (evt.networth > 0) {
            require(
                usdtTokenContract.transfer(msg.sender, evt.networth),
                "Failed to transfer ticket revenue to provider"
            );
        }

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

    // Internal helper to create a category for an event
    function _createCategoryForEvent(
        uint256 eventId,
        string memory name,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota
    ) internal {
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

    function createCategory(
        uint256 eventId,
        string memory name,
        uint16 discountPercentage,
        uint16 quota,
        bool hasQuota
    ) external onlyRole(VERIFIED_SHAMAN_ROLE) {
        require(eventId < events.length, "Event does not exist");
        Event storage evt = events[eventId];
        // Only event creator can add categories (or local provider for any event)
        require(
            evt.creator == msg.sender || hasRole(LOCAL_PROVIDER_ROLE, msg.sender),
            "Only event creator or local provider can add categories"
        );
        _createCategoryForEvent(eventId, name, discountPercentage, quota, hasQuota);
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

    function getEventsCount() external view returns (uint256) {
        return events.length;
    }
}
