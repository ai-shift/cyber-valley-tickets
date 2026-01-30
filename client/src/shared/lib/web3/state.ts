import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";
import { createThirdwebClient, defineChain, getContract } from "thirdweb";
import { createWallet } from "thirdweb/wallets";

export const STAFF_ROLE = keccak256(toUtf8Bytes("STAFF_ROLE")) as `0x${string}`;
export const VERIFIED_SHAMAN_ROLE = keccak256(
  toUtf8Bytes("VERIFIED_SHAMAN_ROLE"),
) as `0x${string}`;
export const LOCAL_PROVIDER_ROLE = keccak256(
  toUtf8Bytes("LOCAL_PROVIDER_ROLE"),
) as `0x${string}`;

export const wallets = [
  createWallet("inApp", {
    auth: {
      options: ["phone", "email"],
      mode: "popup",
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export const cvlandChain = defineChain({
  id: 1337,
  rpc: import.meta.env.PUBLIC_HTTP_ETH_NODE_HOST,
});

export const client = createThirdwebClient({
  clientId: import.meta.env.PUBLIC_THIRDWEB_PUBLIC_CLIENT_ID,
});

export const eventManager = getContract({
  client,
  chain: cvlandChain,
  address: import.meta.env.PUBLIC_EVENT_MANAGER_ADDRESS,
  abi: [
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
          internalType: "address",
          name: "provider",
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
          internalType: "bool",
          name: "available",
          type: "bool",
        },
        {
          indexed: false,
          internalType: "enum CyberValleyEventManager.EventPlaceStatus",
          name: "status",
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
          internalType: "address",
          name: "master",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "masterAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "providerAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "provider",
          type: "address",
        },
      ],
      name: "FundsDistributed",
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
          name: "requester",
          type: "address",
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
          internalType: "bool",
          name: "available",
          type: "bool",
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
      name: "NewEventPlaceRequest",
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
      name: "BACKEND_ROLE",
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
      name: "LOCAL_PROVIDER_ROLE",
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
      inputs: [],
      name: "VERIFIED_SHAMAN_ROLE",
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
          name: "eventPlaceId",
          type: "uint256",
        },
      ],
      name: "approveEventPlace",
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
      inputs: [
        {
          internalType: "uint256",
          name: "eventPlaceId",
          type: "uint256",
        },
      ],
      name: "declineEventPlace",
      outputs: [],
      stateMutability: "nonpayable",
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
          internalType: "address",
          name: "requester",
          type: "address",
        },
        {
          internalType: "address",
          name: "provider",
          type: "address",
        },
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
          internalType: "bool",
          name: "available",
          type: "bool",
        },
        {
          internalType: "enum CyberValleyEventManager.EventPlaceStatus",
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
          internalType: "address",
          name: "eoa",
          type: "address",
        },
      ],
      name: "grantLocalProvider",
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
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "localProviderShare",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
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
      name: "masterShare",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
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
          internalType: "address",
          name: "eoa",
          type: "address",
        },
      ],
      name: "revokeLocalProvider",
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
          internalType: "address",
          name: "eoa",
          type: "address",
        },
      ],
      name: "revokeVerifiedShaman",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint8",
          name: "share",
          type: "uint8",
        },
      ],
      name: "setMasterShare",
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
          internalType: "bool",
          name: "_available",
          type: "bool",
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
      name: "submitEventPlaceRequest",
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
          internalType: "bool",
          name: "_available",
          type: "bool",
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
  ],
});

export const eventTicket = getContract({
  client: client,
  chain: cvlandChain,
  address: import.meta.env.PUBLIC_EVENT_TICKET_ADDRESS,
  abi: [
    {
      inputs: [
        {
          internalType: "string",
          name: "name",
          type: "string",
        },
        {
          internalType: "string",
          name: "symbol",
          type: "string",
        },
        {
          internalType: "address",
          name: "_master",
          type: "address",
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
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "ERC721IncorrectOwner",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "ERC721InsufficientApproval",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "approver",
          type: "address",
        },
      ],
      name: "ERC721InvalidApprover",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "operator",
          type: "address",
        },
      ],
      name: "ERC721InvalidOperator",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "ERC721InvalidOwner",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "receiver",
          type: "address",
        },
      ],
      name: "ERC721InvalidReceiver",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "ERC721InvalidSender",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "ERC721NonexistentToken",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "approved",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          indexed: false,
          internalType: "bool",
          name: "approved",
          type: "bool",
        },
      ],
      name: "ApprovalForAll",
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
          internalType: "uint256",
          name: "ticketId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address",
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
      name: "TicketMinted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "ticketId",
          type: "uint256",
        },
      ],
      name: "TicketRedeemed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
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
      name: "EVENT_MANAGER_ROLE",
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
      name: "STAFF_ROLE",
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
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "balanceOf",
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
      name: "eventManagerAddress",
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
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "getApproved",
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
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "operator",
          type: "address",
        },
      ],
      name: "isApprovedForAll",
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
          name: "",
          type: "uint256",
        },
      ],
      name: "isRedeemed",
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
          internalType: "address",
          name: "to",
          type: "address",
        },
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
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "ownerOf",
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
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "redeemTicket",
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
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "safeTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
      ],
      name: "safeTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "operator",
          type: "address",
        },
        {
          internalType: "bool",
          name: "approved",
          type: "bool",
        },
      ],
      name: "setApprovalForAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_eventManagerAddress",
          type: "address",
        },
      ],
      name: "setEventManagerAddress",
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
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "ticketMeta",
      outputs: [
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
      name: "ticketsMeta",
      outputs: [
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
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "tokenURI",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
});

export const erc20 = getContract({
  client: client,
  chain: cvlandChain,
  address: import.meta.env.PUBLIC_ERC20_ADDRESS,
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "ECDSAInvalidSignature",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "length",
          type: "uint256",
        },
      ],
      name: "ECDSAInvalidSignatureLength",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "s",
          type: "bytes32",
        },
      ],
      name: "ECDSAInvalidSignatureS",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "allowance",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "needed",
          type: "uint256",
        },
      ],
      name: "ERC20InsufficientAllowance",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "balance",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "needed",
          type: "uint256",
        },
      ],
      name: "ERC20InsufficientBalance",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "approver",
          type: "address",
        },
      ],
      name: "ERC20InvalidApprover",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "receiver",
          type: "address",
        },
      ],
      name: "ERC20InvalidReceiver",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "ERC20InvalidSender",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
      ],
      name: "ERC20InvalidSpender",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "deadline",
          type: "uint256",
        },
      ],
      name: "ERC2612ExpiredSignature",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "signer",
          type: "address",
        },
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "ERC2612InvalidSigner",
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
          internalType: "uint256",
          name: "currentNonce",
          type: "uint256",
        },
      ],
      name: "InvalidAccountNonce",
      type: "error",
    },
    {
      inputs: [],
      name: "InvalidShortString",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "str",
          type: "string",
        },
      ],
      name: "StringTooLong",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [],
      name: "EIP712DomainChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [],
      name: "DOMAIN_SEPARATOR",
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
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
      ],
      name: "allowance",
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
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
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
      name: "decimals",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "eip712Domain",
      outputs: [
        {
          internalType: "bytes1",
          name: "fields",
          type: "bytes1",
        },
        {
          internalType: "string",
          name: "name",
          type: "string",
        },
        {
          internalType: "string",
          name: "version",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "chainId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "verifyingContract",
          type: "address",
        },
        {
          internalType: "bytes32",
          name: "salt",
          type: "bytes32",
        },
        {
          internalType: "uint256[]",
          name: "extensions",
          type: "uint256[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "nonces",
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
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "deadline",
          type: "uint256",
        },
        {
          internalType: "uint8",
          name: "v",
          type: "uint8",
        },
        {
          internalType: "bytes32",
          name: "r",
          type: "bytes32",
        },
        {
          internalType: "bytes32",
          name: "s",
          type: "bytes32",
        },
      ],
      name: "permit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
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
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
});
