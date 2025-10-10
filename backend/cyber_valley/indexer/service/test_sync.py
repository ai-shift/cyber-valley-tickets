import datetime
import secrets
from dataclasses import dataclass

import base58
import ipfshttpclient
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from hexbytes import HexBytes

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser as UserType

from ._sync import (
    _sync_event_place_updated,
    _sync_event_status_changed,
    _sync_event_updated,
    _sync_new_event_request,
    _sync_ticket_minted,
    _sync_ticket_redeemed,
)
from .events import CyberValleyEventManager, CyberValleyEventTicket

User = get_user_model()


@pytest.fixture
def address() -> str:
    """Generates a random Ethereum address."""
    return "0x" + secrets.token_hex(20)


@pytest.fixture
def user(address: str) -> UserType:
    return User.objects.create(address=address)


@pytest.fixture
def event_place() -> EventPlace:
    return EventPlace.objects.create(
        id=1,
        title="Test Event Place",
        max_tickets=100,
        min_tickets=10,
        min_price=50,
        min_days=7,
        days_before_cancel=3,
        location_url="https://maps.example.com/test-place",
    )


@pytest.fixture
def event(user: UserType, event_place: EventPlace) -> Event:
    return Event.objects.create(
        creator=user,
        place=event_place,
        ticket_price=100,
        tickets_bought=0,
        start_date=timezone.now() + datetime.timedelta(days=1),
        days_amount=3,
        status="submitted",
        title="Test Event",
        description="Test Description",
        created_at=timezone.now(),
        updated_at=timezone.now(),
    )


@pytest.mark.django_db(transaction=True)
def test_sync_new_event_request(user: UserType, event_place: EventPlace) -> None:
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_cid = client.add_json({"network": "x", "value": "@kekius_maximus"})
        cid = client.add_json(
            {
                "title": "eventTitle",
                "description": "eventDescription",
                "cover": "QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n",
                "website": "https://example.com",
                "socialsCid": socials_cid,
            }
        )
    multihash = cid2multihash(cid)
    event_data = CyberValleyEventManager.NewEventRequest.model_validate(
        {
            "id": 1,
            "creator": user.address,
            "eventPlaceId": event_place.id,
            "ticketPrice": 150,
            "cancelDate": 1678886400,
            "startDate": 1679059200,
            "daysAmount": 5,
            "digest": multihash.digest,
            "hashFunction": multihash.hash_function,
            "size": multihash.size,
        }
    )
    _sync_new_event_request(event_data)
    event = Event.objects.get(id=event_data.id)
    assert event.creator == user
    assert event.place == event_place
    assert event.ticket_price == event_data.ticket_price
    assert event.days_amount == event_data.days_amount
    notification = Notification.objects.get(user=user)
    assert notification.title == "Event request sent"
    assert notification.body == "Title: eventTitle"
    # Check only the values that are set by the sync function
    assert event.tickets_bought == 0
    assert event.status == "submitted"


@pytest.mark.django_db
def test_sync_new_event_request_event_place_not_found(user: UserType) -> None:
    event_data = CyberValleyEventManager.NewEventRequest.model_validate(
        {
            "id": 1,
            "creator": user.address,
            "eventPlaceId": 999,
            "ticketPrice": 150,
            "cancelDate": 1678886400,
            "startDate": 1679059200,
            "daysAmount": 5,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )

    with pytest.raises(EventPlace.DoesNotExist):
        _sync_new_event_request(event_data)


@pytest.mark.django_db
def test_sync_event_updated(event: Event) -> None:
    new_event_place = EventPlace.objects.create(
        id=2,
        title="New Event Place",
        max_tickets=200,
        min_tickets=20,
        min_price=75,
        min_days=10,
        days_before_cancel=2,
    )
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_cid = client.add_json({"network": "x", "value": "@kekius_maximus"})
        cid = client.add_json(
            {
                "title": "eventTitle",
                "description": "eventDescription",
                "cover": "QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n",
                "website": "https://example.com",
                "socialsCid": socials_cid,
            }
        )
    multihash = cid2multihash(cid)
    event_data = CyberValleyEventManager.EventUpdated.model_validate(
        {
            "id": event.id,
            "eventPlaceId": new_event_place.id,
            "ticketPrice": 200,
            "cancelDate": 1678886400,
            "startDate": 1679059200,
            "daysAmount": 7,
            "digest": multihash.digest,
            "hashFunction": multihash.hash_function,
            "size": multihash.size,
        }
    )

    _sync_event_updated(event_data)

    event.refresh_from_db()
    assert event.place == new_event_place
    assert event.ticket_price == event_data.ticket_price
    assert event.days_amount == event_data.days_amount


@pytest.mark.django_db
def test_sync_event_updated_event_not_found(event_place: EventPlace) -> None:
    event_data = CyberValleyEventManager.EventUpdated.model_validate(
        {
            "id": 999,
            "eventPlaceId": event_place.id,
            "ticketPrice": 200,
            "cancelDate": 1678886400,
            "startDate": 1679059200,
            "daysAmount": 7,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )

    with pytest.raises(Event.DoesNotExist):
        _sync_event_updated(event_data)


@pytest.mark.django_db
def test_sync_event_updated_event_place_not_found(event: Event) -> None:
    event_data = CyberValleyEventManager.EventUpdated.model_validate(
        {
            "id": event.id,
            "eventPlaceId": 999,
            "ticketPrice": 200,
            "cancelDate": 1678886400,
            "startDate": 1679059200,
            "daysAmount": 7,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )

    with pytest.raises(EventPlace.DoesNotExist):
        _sync_event_updated(event_data)


@pytest.mark.django_db
def test_sync_event_place_updated(event_place: EventPlace, address: str) -> None:
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        cid = client.add_json(
            {
                "title": "Changed event place title",
                "description": "Change evenet place description",
                "location_url": "https://maps.example.com/new-location",
            }
        )
    multihash = cid2multihash(cid)
    event_data = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "provider": address,
            "eventPlaceId": event_place.id,
            "maxTickets": 150,
            "minTickets": 15,
            "minPrice": 75,
            "minDays": 10,
            "available": True,
            "daysBeforeCancel": 5,
            "digest": multihash.digest,
            "hashFunction": multihash.hash_function,
            "size": multihash.size,
        }
    )

    _sync_event_place_updated(event_data)

    event_place.refresh_from_db()
    assert event_place.max_tickets == event_data.max_tickets
    assert event_place.min_tickets == event_data.min_tickets
    assert event_place.min_price == event_data.min_price
    assert event_place.min_days == event_data.min_days
    assert event_place.title == "Changed event place title"


@pytest.mark.django_db
def test_sync_event_place_updated_event_place_not_found(address: str) -> None:
    event_data = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "provider": address,
            "eventPlaceId": 999,
            "maxTickets": 150,
            "minTickets": 15,
            "minPrice": 75,
            "minDays": 10,
            "available": True,
            "daysBeforeCancel": 5,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )

    with pytest.raises(EventPlace.DoesNotExist):
        _sync_event_place_updated(event_data)


@pytest.mark.django_db
def test_sync_ticket_minted(event: Event, user: UserType) -> None:
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_cid = client.add_json({"network": "x", "value": "@kekius_maximus"})
    multihash = cid2multihash(socials_cid)
    event_data = CyberValleyEventTicket.TicketMinted.model_validate(
        {
            "eventId": event.id,
            "ticketId": 123,
            "owner": user.address,
            "digest": multihash.digest,
            "hashFunction": multihash.hash_function,
            "size": multihash.size,
        }
    )

    _sync_ticket_minted(event_data)

    ticket = Ticket.objects.get(id=str(event_data.ticket_id))
    assert ticket.event == event
    assert ticket.owner == user

    event.refresh_from_db()
    assert event.tickets_bought == 1

    notification = Notification.objects.get(user=user)
    assert notification.title == "Your ticket minted"
    assert (
        notification.body
        == "A new ticket with id 123 has been minted for event Test Event."
    )


@pytest.mark.django_db
def test_sync_ticket_minted_event_not_found(user: UserType) -> None:
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_cid = client.add_json({"network": "x", "value": "@kekius_maximus"})
    multihash = cid2multihash(socials_cid)
    event_data = CyberValleyEventTicket.TicketMinted.model_validate(
        {
            "eventId": 999,
            "ticketId": 123,
            "owner": user.address,
            "digest": multihash.digest,
            "hashFunction": multihash.hash_function,
            "size": multihash.size,
        }
    )
    with pytest.raises(Event.DoesNotExist):
        _sync_ticket_minted(event_data)


@pytest.mark.django_db
def test_sync_event_status_changed(event: Event) -> None:
    event_data = CyberValleyEventManager.EventStatusChanged(
        eventId=event.id, status=1
    )  # 1 means 'approved'

    _sync_event_status_changed(event_data)

    event.refresh_from_db()
    status_mapping = {
        0: "submitted",
        1: "approved",
        2: "declined",
        3: "cancelled",
        4: "closed",
    }
    assert event.status == status_mapping.get(event_data.status)


@pytest.mark.django_db
def test_sync_event_status_changed_event_not_found() -> None:
    event_data = CyberValleyEventManager.EventStatusChanged(eventId=999, status=1)

    with pytest.raises(Event.DoesNotExist):
        _sync_event_status_changed(event_data)


@pytest.mark.django_db
def test_sync_event_status_changed_invalid_status(event: Event) -> None:
    event_data = CyberValleyEventManager.EventStatusChanged(eventId=event.id, status=99)

    with pytest.raises(AssertionError):
        _sync_event_status_changed(event_data)


@pytest.mark.django_db
def test_sync_ticket_redeemed(event: Event, user: UserType) -> None:
    ticket_id = "123"
    ticket = Ticket.objects.create(event=event, owner=user, id=ticket_id)

    event_data = CyberValleyEventTicket.TicketRedeemed(ticketId=123)

    _sync_ticket_redeemed(event_data)

    ticket.refresh_from_db()
    assert ticket.is_redeemed is True


@pytest.mark.django_db
def test_sync_ticket_redeemed_ticket_not_found() -> None:
    event_data = CyberValleyEventTicket.TicketRedeemed(ticketId=999)

    with pytest.raises(Ticket.DoesNotExist):
        _sync_ticket_redeemed(event_data)


@dataclass
class Multihash:
    digest: HexBytes
    hash_function: int
    size: int


def cid2multihash(cid: str) -> Multihash:
    decoded = base58.b58decode(cid)
    return Multihash(
        digest=HexBytes.fromhex(decoded[2:].hex()),
        hash_function=decoded[0],
        size=decoded[1],
    )
