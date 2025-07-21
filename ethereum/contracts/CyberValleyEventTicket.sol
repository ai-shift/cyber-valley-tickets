// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CyberValley.sol";

// TODO: Pad layout after general work finish
contract CyberValleyEventTicket is ERC721, AccessControl {
    using CyberValley for CyberValley.Multihash;

    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");
    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
    bytes32 public constant EVENT_MANAGER_ROLE = keccak256("EVENT_MANAGER_ROLE");

    uint256 private lastTokenId;
    mapping(uint256 => CyberValley.Multihash) public ticketsMeta;
    mapping(uint256 => bool) public isRedeemed;

    address public eventManagerAddress;

    event TicketMinted(
        uint256 eventId,
        uint256 ticketId,
        address owner,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    );

    event TicketRedeemed(uint256 ticketId);

    constructor(
        string memory name,
        string memory symbol,
        address _master
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, _master);
        _grantRole(MASTER_ROLE, _master);
        _grantRole(STAFF_ROLE, _master);
    }

    modifier onlyEventManager() {
        require(
            hasRole(EVENT_MANAGER_ROLE, msg.sender),
            "Must have event manager role"
        );
        _;
    }

    modifier onlyMaster() {
        require(hasRole(MASTER_ROLE, msg.sender), "Must have master role");
        _;
    }

    modifier onlyStaff() {
        require(hasRole(STAFF_ROLE, msg.sender), "Must have staff role");
        _;
    }

    function setEventManagerAddress(address _eventManagerAddress) external {
        require(
            _eventManagerAddress != address(0),
            "Event manager address cannot be zero"
        );
        require(
            eventManagerAddress == address(0),
            "Event manager was already saved"
        );
        _grantRole(EVENT_MANAGER_ROLE, _eventManagerAddress);
    }

    function mint(
        address to,
        uint256 eventId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) external onlyEventManager {
        lastTokenId += 1;
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

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        CyberValley.Multihash memory mh = ticketsMeta[tokenId];
        string memory cid = toCID(mh.digest, mh.hashFunction, mh.size);
        return string(abi.encodePacked("ipfs://", cid));
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(from == address(0), "Token transfer is disabled");
        super.transferFrom(from, to, tokenId);
    }

    function redeemTicket(uint256 tokenId) external onlyStaff {
        require(!isRedeemed[tokenId], "Token was redeemed already");
        isRedeemed[tokenId] = true;
        emit TicketRedeemed(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function toCID(bytes32 digest, uint8 hashFunction, uint8 size) internal pure returns (string memory) {
        if (size == 0) return ""; // Return empty string for size 0

        bytes memory hashBytes = new bytes(32);
        for (uint j = 0; j < 32; j++) {
            hashBytes[j] = digest[j];
        }

        bytes memory multihashBytes = new bytes(2 + hashBytes.length);
        multihashBytes[0] = bytes1(hashFunction);
        multihashBytes[1] = bytes1(size);

        for (uint j = 0; j < hashBytes.length; j++) {
            multihashBytes[j + 2] = hashBytes[j];
        }

        return bytesToHex(Base58.encode(multihashBytes));
    }

    
    function bytesToHex(bytes memory data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(data.length * 2);

        for (uint i = 0; i < data.length; i++) {
            result[i * 2] = hexChars[uint8(data[i] >> 4)];
            result[i * 2 + 1] = hexChars[uint8(data[i] & 0x0f)];
        }

        return string(result);
    }
}

// Source: https://github.com/storyicon/base58-solidity/blob/master/contracts/Base58.sol
// It's hard copied cause of requirement to deploy this library if it's imported
// and i it's damn stupid for the given use case
library Base58 {
    bytes constant ALPHABET =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    function encode(bytes memory data_) internal pure returns (bytes memory) {
        unchecked {
            uint256 size = data_.length;
            uint256 zeroCount;
            while (zeroCount < size && data_[zeroCount] == 0) {
                zeroCount++;
            }
            size = zeroCount + ((size - zeroCount) * 8351) / 6115 + 1;
            bytes memory slot = new bytes(size);
            uint32 carry;
            int256 m;
            int256 high = int256(size) - 1;
            for (uint256 i = 0; i < data_.length; i++) {
                m = int256(size - 1);
                for (carry = uint8(data_[i]); m > high || carry != 0; m--) {
                    carry = carry + 256 * uint8(slot[uint256(m)]);
                    slot[uint256(m)] = bytes1(uint8(carry % 58));
                    carry /= 58;
                }
                high = m;
            }
            uint256 n;
            for (n = zeroCount; n < size && slot[n] == 0; n++) {}
            size = slot.length - (n - zeroCount);
            bytes memory out = new bytes(size);
            for (uint256 i = 0; i < size; i++) {
                uint256 j = i + n - zeroCount;
                out[i] = ALPHABET[uint8(slot[j])];
            }
            return out;
        }
    }
}
