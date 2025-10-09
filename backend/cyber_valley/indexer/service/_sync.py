import logging
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

import base58
import ipfshttpclient
from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from pydantic import BaseModel
from returns.result import safe

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser, UserSocials

from .events import CyberValleyEventManager, CyberValleyEventTicket

log = logging.getLogger(__name__)


@dataclass
class UnknownEventError(Exception):
    event: BaseModel


@safe
def synchronize_event(event_data: BaseModel) -> None:  # noqa: C901
    match event_data:
        case CyberValleyEventManager.EventPlaceUpdated():
            _sync_event_place_updated(event_data)
            log.info("Event place updated")
        case CyberValleyEventManager.NewEventRequest():
            _sync_new_event_request(event_data)
            log.info("New event request")
        case CyberValleyEventManager.EventUpdated():
            _sync_event_updated(event_data)
            log.info("Event updated")
        case CyberValleyEventTicket.TicketMinted():
            _sync_ticket_minted(event_data)
            log.info("Ticket minted")
        case CyberValleyEventManager.EventStatusChanged():
            _sync_event_status_changed(event_data)
            log.info("Event status changed")
        case CyberValleyEventTicket.TicketRedeemed():
            _sync_ticket_redeemed(event_data)
            log.info("Ticket redeemed")
        case (
            CyberValleyEventTicket.RoleGranted() | CyberValleyEventManager.RoleGranted()
        ):
            _sync_role_granted(event_data)
            log.info("Role granted")
        case CyberValleyEventManager.RoleAdminChanged():
            pass
        case CyberValleyEventManager.RoleRevoked():
            _sync_role_revoked(event_data)
            log.info("Ticket redeemed")
        case CyberValleyEventTicket.Transfer():
            pass
        case _:
            log.error("Unknown event data %s", type(event_data))
            raise UnknownEventError(event_data)


@transaction.atomic
def _sync_new_event_request(
    event_data: CyberValleyEventManager.NewEventRequest,
) -> None:
    creator, _ = CyberValleyUser.objects.get_or_create(address=event_data.creator)
    place = EventPlace.objects.get(id=event_data.event_place_id)
    cid = _multihash2cid(event_data)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        data = client.get_json(cid)
        log.info("data=%s", data)
        socials = client.get_json(data["socialsCid"])
    with suppress(IntegrityError), transaction.atomic():
        UserSocials.objects.create(
            user=creator, network=socials["network"], value=socials["value"]
        )

    event = Event.objects.create(
        id=event_data.id,
        creator=creator,
        place=place,
        ticket_price=event_data.ticket_price,
        tickets_bought=0,
        start_date=datetime.fromtimestamp(event_data.start_date, tz=UTC),
        days_amount=event_data.days_amount,
        status="submitted",
        title=data["title"],
        description=data["description"],
        image_url=f"{settings.IPFS_PUBLIC_HOST}/ipfs/{data['cover']}",
        website=data["website"],
        created_at=timezone.now(),
        updated_at=timezone.now(),
    )

    Notification.objects.create(
        user=creator,
        title="Event request sent",
        body=f"Title: {event.title}",
    )
    if place.provider:
        Notification.objects.create(
            user=place.provider,
            title="New event request",
            body=f"Title: {event.title}. From {socials['network']}: {socials['value']}",
        )


@transaction.atomic
def _sync_event_updated(event_data: CyberValleyEventManager.EventUpdated) -> None:
    event = Event.objects.get(id=event_data.id)
    place = EventPlace.objects.get(id=event_data.event_place_id)

    cid = _multihash2cid(event_data)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        data = client.get_json(cid)
        socials = client.get_json(data["socialsCid"])

    with suppress(IntegrityError), transaction.atomic():
        UserSocials.objects.create(
            user=event.creator, network=socials["network"], value=socials["value"]
        )

    event.place = place
    event.ticket_price = event_data.ticket_price
    event.start_date = datetime.fromtimestamp(event_data.start_date, tz=UTC)
    event.days_amount = event_data.days_amount
    event.updated_at = timezone.now()
    event.title = data["title"]
    event.description = data["description"]
    event.image_url = f"{settings.IPFS_PUBLIC_HOST}/ipfs/{data['cover']}"
    event.save()

    notify_users = [event.creator]
    if place.provider:
        notify_users.append(place.provider)

    for user in notify_users:
        Notification.objects.create(
            user=user,
            title="Event updated",
            body=f"Title: {event.title}",
        )


@transaction.atomic
def _sync_event_place_updated(
    event_data: CyberValleyEventManager.EventPlaceUpdated,
) -> None:
    cid = _multihash2cid(event_data)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        data = client.get_json(cid)

    provider, _ = CyberValleyUser.objects.get_or_create(address=event_data.provider)

    place, created = EventPlace.objects.get_or_create(
        id=event_data.event_place_id,
        defaults={
            "provider": provider,
            "title": data["title"],
            "location_url": data["location_url"],
            "max_tickets": event_data.max_tickets,
            "min_tickets": event_data.min_tickets,
            "min_price": event_data.min_price,
            "min_days": event_data.min_days,
            "days_before_cancel": event_data.days_before_cancel,
            "available": event_data.available,
        },
    )

    if not created:
        place.provider = provider
        place.title = data["title"]
        place.location_url = data["location_url"]
        place.max_tickets = event_data.max_tickets
        place.min_tickets = event_data.min_tickets
        place.min_price = event_data.min_price
        place.min_days = event_data.min_days
        place.days_before_cancel = event_data.days_before_cancel
        place.available = event_data.available
        place.save()
        log.info("Event place %s was updated", event_data.event_place_id)
    else:
        log.info("Event place %s was created", event_data.event_place_id)

    if place.provider:
        action = "created" if created else "updated"
        Notification.objects.create(
            user=place.provider,
            title=f"Event place {action}",
            body=f"Title: {place.title}",
        )


@transaction.atomic
def _sync_ticket_minted(event_data: CyberValleyEventTicket.TicketMinted) -> None:
    event = Event.objects.get(id=event_data.event_id)
    owner, _ = CyberValleyUser.objects.get_or_create(address=event_data.owner)

    cid = _multihash2cid(event_data)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        data = client.get_json(cid)
        socials = client.get_json(data["socials"])

    with suppress(IntegrityError), transaction.atomic():
        UserSocials.objects.create(
            user=owner, network=socials["network"], value=socials["value"]
        )

    log.info(
        "Saving ticket for event %s, owner %s from event %s", event, owner, event_data
    )
    Ticket.objects.create(
        event=event,
        owner=owner,
        id=str(event_data.ticket_id),
    )

    event.tickets_bought += 1
    event.save()

    Notification.objects.create(
        user=owner,
        title="Your ticket minted",
        body=(
            f"A new ticket with id {event_data.ticket_id} "
            f"has been minted for event {event.title}."
        ),
    )


def _sync_event_status_changed(
    event_data: CyberValleyEventManager.EventStatusChanged,
) -> None:
    event = Event.objects.get(id=event_data.event_id)

    # TODO: Rewrite to IntEnum
    status_mapping = {
        0: "submitted",
        1: "approved",
        2: "declined",
        3: "cancelled",
        4: "closed",
    }

    new_status = status_mapping.get(event_data.status)
    assert new_status is not None, f"Unexpected status {event_data}"

    event.status = new_status
    event.save()

    # Notify creator
    Notification.objects.create(
        user=event.creator,
        title="Event status updated",
        body=f"Event {event.title}. New status: {new_status}",
    )

    # Notify provider
    if event.place.provider:
        body = f"Event {event.title}. New status: {new_status}"
        if event.status in ("cancelled", "closed"):
            networth = event.tickets_bought * event.ticket_price + 100
            body += f"\nEarned {networth} USDT"
        Notification.objects.create(
            user=event.place.provider,
            title="Event status updated",
            body=body,
        )


@transaction.atomic
def _sync_ticket_redeemed(event_data: CyberValleyEventTicket.TicketRedeemed) -> None:
    ticket = Ticket.objects.get(id=event_data.ticket_id)

    ticket.is_redeemed = True
    ticket.save()

    Notification.objects.create(
        user=ticket.owner,
        title="Ticket redeemed",
        body=f"Event {ticket.event.title}",
    )


@transaction.atomic
def _sync_role_granted(
    event_data: CyberValleyEventManager.RoleGranted
    | CyberValleyEventTicket.RoleGranted,
) -> None:
    if event_data.role == "DEFAULT_ADMIN_ROLE":
        return
    user, created = CyberValleyUser.objects.get_or_create(address=event_data.account)
    user.role = event_data.role.split("_")[0].lower()
    user.save()
    Notification.objects.create(
        user=user,
        title="Role granted",
        body=f"{user.role} granted to you",
    )

    admins = CyberValleyUser.objects.filter(
        role__in=[CyberValleyUser.LOCAL_PROVIDER, CyberValleyUser.MASTER]
    )
    for admin in admins:
        if user.address == admin.address:
            continue
        Notification.objects.create(
            user=admin,
            title="Role granted",
            body=f"{user.role} granted to {user.address}",
        )

    if user.role == CyberValleyUser.LOCAL_PROVIDER:
        # TODO: Find telegram info in socials and send message
        raise NotImplementedError


@transaction.atomic
def _sync_role_revoked(
    event_data: CyberValleyEventManager.RoleRevoked
    | CyberValleyEventTicket.RoleRevoked,
) -> None:
    role = event_data.role.split("_")[0].lower()
    assert role == "staff", f"Got unexpected {role=}"
    user, created = CyberValleyUser.objects.get_or_create(address=event_data.account)
    user.role = CyberValleyUser.CUSTOMER
    user.save()
    Notification.objects.create(
        user=user,
        title="Role revoked",
        body="Staff role was revoked",
    )
    admins = CyberValleyUser.objects.filter(
        role__in=[CyberValleyUser.LOCAL_PROVIDER, CyberValleyUser.MASTER]
    )
    for admin in admins:
        if user.address == admin.address:
            continue
        Notification.objects.create(
            user=admin,
            title="Role revoked",
            body=f"Staff role was revoked from {user.address}",
        )


class MultihashLike(Protocol):
    digest: str
    hash_function: int
    size: int


def _multihash2cid(multihash: MultihashLike) -> None | str:
    digest, hash_function, size = (
        multihash.digest,
        multihash.hash_function,
        multihash.size,
    )
    if size == 0:
        return None

    hash_bytes = bytes.fromhex(digest)
    multihash_bytes = bytes([hash_function, size]) + hash_bytes

    return base58.b58encode(multihash_bytes).decode("utf-8")
