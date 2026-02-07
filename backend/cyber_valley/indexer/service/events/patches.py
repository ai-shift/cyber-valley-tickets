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
    "ADMIN_ROLE",
    "PROFILE_MANAGER_ROLE",
)
_BYTES_TO_ROLE = {Web3.keccak(text=role): role for role in _ROLES}
_BYTES_TO_ROLE[HexBytes(b"\x00" * 32)] = _ROLES[0]


def validate_role(value: HexBytes) -> str:
    role = _BYTES_TO_ROLE.get(value)
    if role is not None:
        return role

    # Indexer should be forward-compatible with new roles. Keep indexing and
    # let the role sync decide whether it's relevant.
    log.warning("Unknown role bytes %s", value.hex())
    return value.hex()


def validate_digest(value: HexBytes | bytes | str) -> str:
    if isinstance(value, str):
        return value
    return value.hex()
