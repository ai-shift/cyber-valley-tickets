// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./CyberValleyEventTicket.sol";
import "./DateOverlapChecker.sol";

contract CyberValleyEventManager is AccessControl, DateOverlapChecker {
    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");

    struct EventPlace {
        uint16 maxTickets;
        uint16 minTickets;
        uint16 minPrice;
        uint8 minDays;
    }

    struct EventRequest {
        uint256 id;
        address creator;
        uint256 eventPlaceId;
        uint16 ticketPrice;
        uint256 cancelDate;
        uint256 startDate;
        uint16 daysAmount;
    }

    struct Event {
        address creator;
        uint256 eventPlaceId;
        uint16 ticketPrice;
        uint256 cancelDate;
        uint256 startDate;
        uint16 daysAmount;
    }

    event NewEventPlaceAvailable(
        uint256 eventPlaceId,
        uint16 maxTickets,
        uint16 minTickets,
        uint16 minPrice,
        uint8 minDays
    );
    event EventPlaceUpdated(
        uint256 eventPlaceId,
        uint16 maxTickets,
        uint16 minTickets,
        uint16 minPrice,
        uint8 minDays
    );
    event NewEventRequest(
        address creator,
        uint256 id,
        uint256 eventPlaceId,
        uint16 ticketPrice,
        uint256 cancelDate,
        uint256 startDate,
        uint16 daysAmount
    );
    event EventApproved(uint256 eventRequestId);

    IERC20 public usdtTokenContract;

    uint256 public devTeamPercentage;
    address public devTeam;
    uint256 public masterPercentage;
    uint256 public eventRequestPrice;

    EventPlace[] public eventPlaces;
    mapping(uint256 => EventRequest) public eventRequests;
    Event[] public events;

    modifier onlyMaster() {
        require(hasRole(MASTER_ROLE, msg.sender), "Must have master role");
        _;
    }

    constructor(
        address _usdtTokenContract,
        address master,
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
        devTeamPercentage = _devTeamPercentage;
        devTeam = _devTeam;
        masterPercentage = _masterPercentage;
        eventRequestPrice = _eventRequestPrice;

        _grantRole(DEFAULT_ADMIN_ROLE, master);
        _grantRole(MASTER_ROLE, master);
    }

    function createEventPlace(
        uint16 _maxTickets,
        uint16 _minTickets,
        uint16 _minPrice,
        uint8 _minDays
    ) external onlyMaster {
        EventPlace memory place = EventPlace({
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            minDays: _minDays
        });
        _validateEventPlace(place);
        eventPlaces.push(place);
        emit NewEventPlaceAvailable(
            eventPlaces.length - 1,
            _maxTickets,
            _minTickets,
            _minPrice,
            _minDays
        );
    }

    function updateEventPlace(
        uint256 eventPlaceId,
        uint16 _maxTickets,
        uint16 _minTickets,
        uint16 _minPrice,
        uint8 _minDays
    ) external onlyMaster {
        require(eventPlaceId < eventPlaces.length, "eventPlaceId should exist");
        EventPlace memory place = EventPlace({
            maxTickets: _maxTickets,
            minTickets: _minTickets,
            minPrice: _minPrice,
            minDays: _minDays
        });
        _validateEventPlace(place);
        eventPlaces[eventPlaceId] = place;
        emit EventPlaceUpdated(
            eventPlaceId,
            _maxTickets,
            _minTickets,
            _minPrice,
            _minDays
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
                eventPlace.minDays > 0,
            "Values must be greater than zero"
        );
    }

    function submitEventRequest(
        uint256 id,
        uint256 eventPlaceId,
        uint16 ticketPrice,
        uint256 cancelDate,
        uint256 startDate,
        uint16 daysAmount
    ) external {
        EventPlace storage place = eventPlaces[eventPlaceId];
        require(
            place.minPrice <= ticketPrice,
            "Ticket price is less than allowed"
        );
        require(
            place.minDays <= daysAmount,
            "Days amount is less than allowed"
        );
        require(
            cancelDate < startDate,
            "Cancelation date should be earlier than start"
        );
        require(
            cancelDate >= block.timestamp,
            "Requested event can't be in the past"
        );
        require(
            startDate - cancelDate >= SECONDS_IN_DAY,
            "Cancel date should be at least one day before the start date"
        );
        // Saves from requests that will allocate a Flot of buckets
        // in the `DateOverlapChecker`
        require(
            startDate - block.timestamp <= SECONDS_IN_DAY * BUCKET_SIZE,
            "Requested event is too far in the future"
        );
        require(
            checkNoOverlap(
                eventPlaceId,
                startDate,
                startDate + daysAmount * SECONDS_IN_DAY
            ),
            "Requested event overlaps with existing"
        );
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

        EventRequest memory request = EventRequest({
            id: id,
            creator: msg.sender,
            eventPlaceId: eventPlaceId,
            ticketPrice: ticketPrice,
            cancelDate: cancelDate,
            startDate: startDate,
            daysAmount: daysAmount
        });
        eventRequests[id] = request;

        emit NewEventRequest(
            msg.sender,
            id,
            eventPlaceId,
            ticketPrice,
            cancelDate,
            startDate,
            daysAmount
        );
    }

    function approveEvent(uint256 eventRequestId) external onlyMaster {
        EventRequest storage request = eventRequests[eventRequestId];
        require(
            request.creator != address(0),
            "Event request with given id does not exist"
        );

        allocateDateRange(
            request.eventPlaceId,
            request.startDate,
            request.startDate + request.daysAmount * SECONDS_IN_DAY
        );
        events.push(
            Event({
                creator: request.creator,
                eventPlaceId: request.eventPlaceId,
                ticketPrice: request.ticketPrice,
                cancelDate: request.cancelDate,
                startDate: request.startDate,
                daysAmount: request.daysAmount
            })
        );
        delete eventRequests[eventRequestId];
        emit EventApproved(eventRequestId);
    }
}
