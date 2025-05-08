export default [
  {
    inputs: [
      {
        internalType: "address",
        name: "_usdtTokenContract",
        type: "address",
      },
      {
        internalType: "address",
        name: "_eventTicketContract",
        type: "address",
      },
      {
        internalType: "address",
        name: "_master",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_masterPercentage",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_devTeam",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_devTeamPercentage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_eventRequestPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_initialOffest",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "maxTickets",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "minTickets",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "minPrice",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "daysBeforeCancel",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "minDays",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "EventPlaceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum CyberValleyEventManager.EventStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "EventStatusChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "EventTicketVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "ticketPrice",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startDate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "daysAmount",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "EventUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "maxTickets",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "minTickets",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "minPrice",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "daysBeforeCancel",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "minDays",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "NewEventPlaceAvailable",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "ticketPrice",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startDate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "daysAmount",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "NewEventRequest",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "BUCKET_SIZE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MASTER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SECONDS_IN_DAY",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
    ],
    name: "approveEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
    ],
    name: "cancelEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
    ],
    name: "closeEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "_maxTickets",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "_minTickets",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "_minPrice",
        type: "uint16",
      },
      {
        internalType: "uint8",
        name: "_daysBeforeCancel",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "_minDays",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "createEventPlace",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
    ],
    name: "declineEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "devTeam",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "devTeamPercentage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "eventPlaces",
    outputs: [
      {
        internalType: "uint16",
        name: "maxTickets",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "minTickets",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "minPrice",
        type: "uint16",
      },
      {
        internalType: "uint8",
        name: "daysBeforeCancel",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "minDays",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "digest",
            type: "bytes32",
          },
          {
            internalType: "uint8",
            name: "hashFunction",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "size",
            type: "uint8",
          },
        ],
        internalType: "struct CyberValley.Multihash",
        name: "meta",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eventRequestPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eventTicketContract",
    outputs: [
      {
        internalType: "contract CyberValleyEventTicket",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "events",
    outputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "ticketPrice",
        type: "uint16",
      },
      {
        internalType: "uint256",
        name: "startDate",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "daysAmount",
        type: "uint16",
      },
      {
        internalType: "enum CyberValleyEventManager.EventStatus",
        name: "status",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "digest",
            type: "bytes32",
          },
          {
            internalType: "uint8",
            name: "hashFunction",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "size",
            type: "uint8",
          },
        ],
        internalType: "struct CyberValley.Multihash",
        name: "meta",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "master",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "masterPercentage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "mintTicket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "ticketPrice",
        type: "uint16",
      },
      {
        internalType: "uint256",
        name: "startDate",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "daysAmount",
        type: "uint16",
      },
      {
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "submitEventRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "ticketPrice",
        type: "uint16",
      },
      {
        internalType: "uint256",
        name: "startDate",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "daysAmount",
        type: "uint16",
      },
      {
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "updateEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "eventPlaceId",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "_maxTickets",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "_minTickets",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "_minPrice",
        type: "uint16",
      },
      {
        internalType: "uint8",
        name: "_daysBeforeCancel",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "_minDays",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "digest",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "hashFunction",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "size",
        type: "uint8",
      },
    ],
    name: "updateEventPlace",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdtTokenContract",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
