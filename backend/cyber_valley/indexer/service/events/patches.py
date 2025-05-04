from hexbytes import HexBytes
from web3 import Web3

_ROLES = ("DEFAULT_ADMIN_ROLE", "MASTER_ROLE", "STAFF_ROLE", "EVENT_MANAGER_ROLE")
_BYTES_TO_ROLE = {Web3.keccak(text=role): role for role in _ROLES}
_BYTES_TO_ROLE[HexBytes(b"\x00" * 32)] = _ROLES[0]


def validate_role(value: HexBytes) -> str:
    try:
        return _BYTES_TO_ROLE[value]
    except KeyError as e:
        raise ValueError from e
