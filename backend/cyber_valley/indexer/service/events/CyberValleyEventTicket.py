# noqa: N999


from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

from .patches import validate_role


class Approval(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    owner: str
    approved: str
    token_id: int = Field(..., alias="tokenId")


class ApprovalForAll(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    owner: str
    operator: str
    approved: bool


class RoleAdminChanged(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    role: str
    previous_admin_role: str = Field(..., alias="previousAdminRole")
    new_admin_role: str = Field(..., alias="newAdminRole")


class RoleGranted(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    role: Annotated[str, BeforeValidator(validate_role)]
    account: str
    sender: str


class RoleRevoked(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    role: str
    account: str
    sender: str


class TicketMinted(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_id: int = Field(..., alias="eventId")
    ticket_id: int = Field(..., alias="ticketId")
    owner: str
    digest: str
    hash_function: int = Field(..., alias="hashFunction")
    size: int


class TicketRedeemed(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    ticket_id: int = Field(..., alias="ticketId")


class Transfer(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    from_: str = Field(..., alias="from")
    to: str
    token_id: int = Field(..., alias="tokenId")
