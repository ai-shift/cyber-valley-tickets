# noqa: N999


from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

from .patches import validate_digest, validate_role


class EventPlaceUpdated(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_place_id: int = Field(..., alias="eventPlaceId")
    max_tickets: int = Field(..., alias="maxTickets")
    min_tickets: int = Field(..., alias="minTickets")
    min_price: int = Field(..., alias="minPrice")
    days_before_cancel: int = Field(..., alias="daysBeforeCancel")
    min_days: int = Field(..., alias="minDays")
    digest: str
    hash_function: int = Field(..., alias="hashFunction")
    size: int


class EventStatusChanged(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_id: int = Field(..., alias="eventId")
    status: int


class EventTicketVerified(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    token_id: int = Field(..., alias="tokenId")


class EventUpdated(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    id: int
    event_place_id: int = Field(..., alias="eventPlaceId")
    ticket_price: int = Field(..., alias="ticketPrice")
    start_date: int = Field(..., alias="startDate")
    days_amount: int = Field(..., alias="daysAmount")
    digest: Annotated[str, BeforeValidator(validate_digest)]
    hash_function: int = Field(..., alias="hashFunction")
    size: int


class NewEventPlaceAvailable(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_place_id: int = Field(..., alias="eventPlaceId")
    max_tickets: int = Field(..., alias="maxTickets")
    min_tickets: int = Field(..., alias="minTickets")
    min_price: int = Field(..., alias="minPrice")
    days_before_cancel: int = Field(..., alias="daysBeforeCancel")
    min_days: int = Field(..., alias="minDays")
    digest: Annotated[str, BeforeValidator(validate_digest)]
    hash_function: int = Field(..., alias="hashFunction")
    size: int


class NewEventRequest(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    id: int
    creator: str
    event_place_id: int = Field(..., alias="eventPlaceId")
    ticket_price: int = Field(..., alias="ticketPrice")
    start_date: int = Field(..., alias="startDate")
    days_amount: int = Field(..., alias="daysAmount")
    digest: Annotated[str, BeforeValidator(validate_digest)]
    hash_function: int = Field(..., alias="hashFunction")
    size: int


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
