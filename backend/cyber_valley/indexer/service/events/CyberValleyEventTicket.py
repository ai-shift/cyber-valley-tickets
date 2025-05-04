# noqa: N999


from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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
    role: str
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


class CyberValleyEvents(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    approval: Optional[Approval] = Field(None, alias="Approval")
    approval_for_all: Optional[ApprovalForAll] = Field(None, alias="ApprovalForAll")
    role_admin_changed: Optional[RoleAdminChanged] = Field(
        None, alias="RoleAdminChanged"
    )
    role_granted: Optional[RoleGranted] = Field(None, alias="RoleGranted")
    role_revoked: Optional[RoleRevoked] = Field(None, alias="RoleRevoked")
    ticket_minted: Optional[TicketMinted] = Field(None, alias="TicketMinted")
    ticket_redeemed: Optional[TicketRedeemed] = Field(None, alias="TicketRedeemed")
    transfer: Optional[Transfer] = Field(None, alias="Transfer")
