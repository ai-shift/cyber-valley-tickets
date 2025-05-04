# noqa: N999


from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

from .patches import validate_role


class EventPlaceUpdated(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_place_id: int = Field(..., alias="eventPlaceId")
    max_tickets: int = Field(..., alias="maxTickets")
    min_tickets: int = Field(..., alias="minTickets")
    min_price: int = Field(..., alias="minPrice")
    min_days: int = Field(..., alias="minDays")


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
    cancel_date: int = Field(..., alias="cancelDate")
    start_date: int = Field(..., alias="startDate")
    days_amount: int = Field(..., alias="daysAmount")


class NewEventPlaceAvailable(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_place_id: int = Field(..., alias="eventPlaceId")
    max_tickets: int = Field(..., alias="maxTickets")
    min_tickets: int = Field(..., alias="minTickets")
    min_price: int = Field(..., alias="minPrice")
    min_days: int = Field(..., alias="minDays")


class NewEventRequest(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    id: int
    creator: str
    event_place_id: int = Field(..., alias="eventPlaceId")
    ticket_price: int = Field(..., alias="ticketPrice")
    cancel_date: int = Field(..., alias="cancelDate")
    start_date: int = Field(..., alias="startDate")
    days_amount: int = Field(..., alias="daysAmount")


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


class CyberValleyEvents(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_place_updated: EventPlaceUpdated | None = Field(
        None, alias="EventPlaceUpdated"
    )
    event_status_changed: EventStatusChanged | None = Field(
        None, alias="EventStatusChanged"
    )
    event_ticket_verified: EventTicketVerified | None = Field(
        None, alias="EventTicketVerified"
    )
    event_updated: EventUpdated | None = Field(None, alias="EventUpdated")
    new_event_place_available: NewEventPlaceAvailable | None = Field(
        None, alias="NewEventPlaceAvailable"
    )
    new_event_request: NewEventRequest | None = Field(None, alias="NewEventRequest")
    role_admin_changed: RoleAdminChanged | None = Field(None, alias="RoleAdminChanged")
    role_granted: RoleGranted | None = Field(None, alias="RoleGranted")
    role_revoked: RoleRevoked | None = Field(None, alias="RoleRevoked")
