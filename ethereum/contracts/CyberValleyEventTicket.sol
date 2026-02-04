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
    bytes32 public constant EVENT_MANAGER_ROLE =
        keccak256("EVENT_MANAGER_ROLE");

    uint256 private lastTokenId;
    mapping(uint256 => CyberValley.Multihash) public ticketsMeta;
    mapping(uint256 => bool) public isRedeemed;

    string public ipfsHost;
    address public eventManagerAddress;

    event TicketMinted(
        uint256 eventId,
        uint256 ticketId,
        uint256 categoryId,
        address owner,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size,
        string referralData,
        uint256 pricePaid
    );

    event TicketRedeemed(uint256 ticketId);

    constructor(
        string memory name,
        string memory symbol,
        address _master,
        string memory _ipfsHost
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, _master);
        _grantRole(MASTER_ROLE, _master);
        _grantRole(STAFF_ROLE, _master);
        ipfsHost = _ipfsHost;
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

    function setIpfsHost(string calldata host) public onlyMaster {
        ipfsHost = host;
    }

    function mint(
        address to,
        uint256 eventId,
        uint256 categoryId,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size,
        string memory referralData,
        uint256 pricePaid
    ) external onlyEventManager {
        lastTokenId += 1;
        _mint(to, lastTokenId);
        ticketsMeta[lastTokenId] = CyberValley.Multihash(
            digest,
            hashFunction,
            size
        );
        emit TicketMinted(eventId, lastTokenId, categoryId, to, digest, hashFunction, size, referralData, pricePaid);
    }

    function mintBatch(
        address to,
        uint256 eventId,
        uint256 categoryId,
        uint256 amount,
        bytes32 digest,
        uint8 hashFunction,
        uint8 size,
        string memory referralData,
        uint256 pricePaid
    ) external onlyEventManager {
        for (uint256 i = 0; i < amount; i++) {
            lastTokenId += 1;
            _mint(to, lastTokenId);
            ticketsMeta[lastTokenId] = CyberValley.Multihash(
                digest,
                hashFunction,
                size
            );
            emit TicketMinted(eventId, lastTokenId, categoryId, to, digest, hashFunction, size, referralData, pricePaid);
        }
    }

    function ticketMeta(
        uint256 tokenId
    ) external view returns (bytes32 digest, uint8 hashFunction, uint8 size) {
        _requireOwned(tokenId);
        CyberValley.Multihash storage meta = ticketsMeta[tokenId];
        return (meta.digest, meta.hashFunction, meta.size);
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        CyberValley.Multihash memory mh = ticketsMeta[tokenId];
        string memory cid = toCID(mh.digest, mh.hashFunction, mh.size);
        return string(abi.encodePacked(ipfsHost, "/", cid));
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

    function toCID(
        bytes32 digest,
        uint8 hashFunction,
        uint8 size
    ) internal pure returns (string memory) {
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

        return string(Base58.encode(multihashBytes));
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
