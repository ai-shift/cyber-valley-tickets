from hexbytes import HexBytes
from pydantic import BaseModel, field_validator
from web3 import Web3

from .CyberValleyEventManager import RoleGranted as EventManagerRoleGranted
from .CyberValleyEventTicket import RoleGranted as EventTicketRoleGranted

_ROLES = ("DEFAULT_ADMIN_ROLE", "MASTER_ROLE", "STAFF_ROLE", "EVENT_MANAGER_ROLE")
_BYTES_TO_ROLE = {Web3.keccak(text=role): role for role in _ROLES}
_BYTES_TO_ROLE[HexBytes(b"\x00" * 32)] = _ROLES[0]


@field_validator("role", mode="before")
@classmethod
def _validate_role(cls: BaseModel, value: HexBytes) -> str:  # noqa: ARG001
    try:
        return _BYTES_TO_ROLE[value]
    except KeyError as e:
        raise ValueError from e


for cls in (EventManagerRoleGranted, EventTicketRoleGranted):
    cls.validate_role = _validate_role
    cls.validate_role = _validate_role
