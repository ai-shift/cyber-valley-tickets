from dataclasses import dataclass
from datetime import UTC, datetime

from django.db import transaction
from django.utils import timezone
from pydantic import BaseModel
from returns.result import safe

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser

from .events import CyberValleyEventManager, CyberValleyEventTicket


@dataclass
class UnknownEventError(Exception):
    event: BaseModel


@safe
def synchronize_event(event_data: BaseModel) -> None:
    match event_data:
        case CyberValleyEventManager.NewEventRequest():
            _sync_new_event_request(event_data)
        case CyberValleyEventManager.EventUpdated():
            _sync_event_updated(event_data)
        case CyberValleyEventManager.EventPlaceUpdated():
            _sync_event_place_updated(event_data)
        case CyberValleyEventManager.NewEventPlaceAvailable():
            _sync_new_event_place_available(event_data)
        case CyberValleyEventTicket.TicketMinted():
            _sync_ticket_minted(event_data)
        case CyberValleyEventManager.EventStatusChanged():
            _sync_event_status_changed(event_data)
        case CyberValleyEventTicket.TicketRedeemed():
            _sync_ticket_redeemed(event_data)
        case _:
            raise UnknownEventError(event_data)


def _sync_new_event_request(
    event_data: CyberValleyEventManager.NewEventRequest,
) -> None:
    creator = CyberValleyUser.objects.get(address=event_data.creator)
    place = EventPlace.objects.get(id=event_data.event_place_id)

    with transaction.atomic():
        Event.objects.create(
            creator=creator,
            place=place,
            ticket_price=event_data.ticket_price,
            tickets_bought=0,
            start_date=datetime.fromtimestamp(event_data.start_date, tz=UTC),
            days_amount=event_data.days_amount,
            status="submitted",
            title=f"Event {event_data.id}",  # Generate a default title
            description="To be populated",  # Generate a default description
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )

        Notification.objects.create(
            user=creator,
            title="New Event Request",
            body=f"A new event request with id {event_data.id} has been created.",
        )


def _sync_event_updated(event_data: CyberValleyEventManager.EventUpdated) -> None:
    event = Event.objects.get(id=event_data.id)
    place = EventPlace.objects.get(id=event_data.event_place_id)

    with transaction.atomic():
        event.place = place
        event.ticket_price = event_data.ticket_price
        event.start_date = datetime.fromtimestamp(event_data.start_date, tz=UTC)
        event.days_amount = event_data.days_amount
        event.updated_at = timezone.now()
        event.save()


def _sync_event_place_updated(
    event_data: CyberValleyEventManager.EventPlaceUpdated,
) -> None:
    place = EventPlace.objects.get(id=event_data.event_place_id)

    with transaction.atomic():
        place.max_tickets = event_data.max_tickets
        place.min_tickets = event_data.min_tickets
        place.min_price = event_data.min_price
        place.min_days = event_data.min_days
        place.save()


def _sync_new_event_place_available(
    event_data: CyberValleyEventManager.NewEventPlaceAvailable,
) -> None:
    EventPlace.objects.create(
        id=event_data.event_place_id,
        title=f"Event Place {event_data.event_place_id}",  # Generate a default title
        max_tickets=event_data.max_tickets,
        min_tickets=event_data.min_tickets,
        min_price=event_data.min_price,
        min_days=event_data.min_days,
    )


def _sync_ticket_minted(event_data: CyberValleyEventTicket.TicketMinted) -> None:
    event = Event.objects.get(id=event_data.event_id)
    owner = CyberValleyUser.objects.get(address=event_data.owner)

    with transaction.atomic():
        Ticket.objects.create(
            event=event,
            owner=owner,
            id=str(event_data.ticket_id),
        )

        event.tickets_bought += 1
        event.save()

        Notification.objects.create(
            user=owner,
            title="New Ticket Minted",
            body=(
                f"A new ticket with id {event_data.ticket_id} "
                f"has been minted for event {event.title}."
            ),
        )


def _sync_event_status_changed(
    event_data: CyberValleyEventManager.EventStatusChanged,
) -> None:
    event = Event.objects.get(id=event_data.event_id)

    status_mapping = {
        0: "submitted",
        1: "approved",
        2: "declined",
        3: "cancelled",
        4: "closed",
    }

    new_status = status_mapping.get(event_data.status)
    assert new_status is not None

    with transaction.atomic():
        event.status = new_status
        event.save()


def _sync_ticket_redeemed(event_data: CyberValleyEventTicket.TicketRedeemed) -> None:
    ticket = Ticket.objects.get(id=event_data.ticket_id)

    with transaction.atomic():
        ticket.is_redeemed = True
        ticket.save()
