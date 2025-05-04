# noqa: N999


from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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


class CyberValleyEvents(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    event_place_updated: Optional[EventPlaceUpdated] = Field(
        None, alias="EventPlaceUpdated"
    )
    event_status_changed: Optional[EventStatusChanged] = Field(
        None, alias="EventStatusChanged"
    )
    event_ticket_verified: Optional[EventTicketVerified] = Field(
        None, alias="EventTicketVerified"
    )
    event_updated: Optional[EventUpdated] = Field(None, alias="EventUpdated")
    new_event_place_available: Optional[NewEventPlaceAvailable] = Field(
        None, alias="NewEventPlaceAvailable"
    )
    new_event_request: Optional[NewEventRequest] = Field(None, alias="NewEventRequest")
    role_admin_changed: Optional[RoleAdminChanged] = Field(
        None, alias="RoleAdminChanged"
    )
    role_granted: Optional[RoleGranted] = Field(None, alias="RoleGranted")
    role_revoked: Optional[RoleRevoked] = Field(None, alias="RoleRevoked")
