import logging

from hexbytes import HexBytes
from web3 import Web3

log = logging.getLogger(__name__)

_ROLES = (
    "DEFAULT_ADMIN_ROLE",
    "MASTER_ROLE",
    "LOCAL_PROVIDER_ROLE",
    "VERIFIED_SHAMAN_ROLE",
    "STAFF_ROLE",
    "EVENT_MANAGER_ROLE",
    "BACKEND_ROLE",
)
_BYTES_TO_ROLE = {Web3.keccak(text=role): role for role in _ROLES}
_BYTES_TO_ROLE[HexBytes(b"\x00" * 32)] = _ROLES[0]


def validate_role(value: HexBytes) -> str:
    try:
        return _BYTES_TO_ROLE[value]
    except KeyError as e:
        print("unexpected role bytes")
        log.exception("unexpected role bytes %s", value)
        raise ValueError from e


def validate_digest(value: HexBytes) -> str:
    return value.hex()
