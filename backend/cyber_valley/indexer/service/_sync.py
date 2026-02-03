import logging
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

import base58
import ipfshttpclient
from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from pydantic import BaseModel
from requests.exceptions import ConnectionError as RequestsConnectionError
from returns.result import safe
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from cyber_valley.events.models import (
    DistributionProfile,
    Event,
    EventPlace,
    Ticket,
    TicketCategory,
)
from cyber_valley.notifications.helpers import send_notification
from cyber_valley.telegram_bot.verification_helpers import (
    send_all_pending_verifications_to_provider,
)
from cyber_valley.users.models import CyberValleyUser, Role, UserSocials

from .events import (
    CyberValleyEventManager,
    CyberValleyEventTicket,
    DynamicRevenueSplitter,
)

log = logging.getLogger(__name__)

ROLE_MAPPING: dict[str, str] = {
    "MASTER_ROLE": CyberValleyUser.MASTER,
    "LOCAL_PROVIDER_ROLE": CyberValleyUser.LOCAL_PROVIDER,
    "VERIFIED_SHAMAN_ROLE": CyberValleyUser.VERIFIED_SHAMAN,
    "STAFF_ROLE": CyberValleyUser.STAFF,
    "EVENT_MANAGER_ROLE": CyberValleyUser.CREATOR,
}


@dataclass
class UnknownEventError(Exception):
    event: BaseModel


def _is_retryable_ipfs_error(exc: BaseException) -> bool:
    """Check if an exception is a retryable IPFS connection error."""
    error_message = str(exc).lower()
    retryable_patterns = [
        "connection reset by peer",
        "connection refused",
        "broken pipe",
        "connection aborted",
    ]
    return isinstance(
        exc, ConnectionError | ConnectionResetError | OSError | RequestsConnectionError
    ) or any(pattern in error_message for pattern in retryable_patterns)


# Retry configuration for IPFS operations
# Handles temporary connection issues with exponential backoff
@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=30),
    retry=retry_if_exception(_is_retryable_ipfs_error),
    before_sleep=before_sleep_log(log, logging.WARNING),
    reraise=True,
)
def _get_ipfs_json_with_retry(cid: str) -> Any:
    """Fetch JSON from IPFS with retry logic for connection resilience."""
    with ipfshttpclient.connect() as client:
        return client.get_json(cid)


def get_ipfs_client() -> ipfshttpclient.Client:
    """Get IPFS client - kept for backward compatibility."""
    return ipfshttpclient.connect()


@safe
def synchronize_event(event_data: BaseModel, *, tx_hash: str | None = None) -> None:
    match event_data:
        case CyberValleyEventManager.NewEventPlaceRequest():
            _sync_new_event_place_request(event_data)
            log.info("New event place request")
        case CyberValleyEventManager.NewEventRequest():
            _sync_new_event_request(event_data, tx_hash)
            log.info("New event request")
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
            CyberValleyEventTicket.RoleGranted()
            | CyberValleyEventManager.RoleGranted()
            | DynamicRevenueSplitter.RoleGranted()
        ):
            _sync_role_granted(event_data)
            log.info("Role granted")
        case (
            CyberValleyEventManager.RoleAdminChanged()
            | DynamicRevenueSplitter.RoleAdminChanged()
        ):
            pass
        case (
            CyberValleyEventManager.RoleRevoked() | DynamicRevenueSplitter.RoleRevoked()
        ):
            _sync_role_revoked(event_data)
            log.info("Role revoked")
        case DynamicRevenueSplitter.RevenueDistributed():
            _sync_revenue_distributed(event_data)
            log.info("Revenue distributed")
        case CyberValleyEventManager.TicketCategoryCreated():
            _sync_ticket_category_created(event_data)
            log.info("Ticket category created")
        case CyberValleyEventManager.TicketCategoryUpdated():
            _sync_ticket_category_updated(event_data)
            log.info("Ticket category updated")
        case CyberValleyEventTicket.Transfer():
            pass
        case DynamicRevenueSplitter.DistributionProfileCreated():
            _sync_distribution_profile_created(event_data)
            log.info("Distribution profile created")
        case DynamicRevenueSplitter.DistributionProfileUpdated():
            _sync_distribution_profile_updated(event_data)
            log.info("Distribution profile updated")
        case DynamicRevenueSplitter.ProfileOwnershipTransferred():
            _sync_profile_ownership_transferred(event_data)
            log.info("Profile ownership transferred")
        case DynamicRevenueSplitter.AllProfilesTransferred():
            _sync_all_profiles_transferred(event_data)
            log.info("All profiles transferred")
        case DynamicRevenueSplitter.ProfileDeactivated():
            _sync_profile_deactivated(event_data)
            log.info("Profile deactivated")
        case DynamicRevenueSplitter.EventProfileSet():
            _sync_event_profile_set(event_data)
            log.info("Event profile set")
        case DynamicRevenueSplitter.DefaultProfileSet():
            # Default profile set - no action needed for now
            # This event is informational; the default profile is used
            # when creating new events without an explicit profile
            log.info("Default profile set: %s", event_data.profile_id)
        case _:
            log.error("Unknown event data %s", type(event_data))
            raise UnknownEventError(event_data)


@transaction.atomic
def _sync_new_event_request(
    event_data: CyberValleyEventManager.NewEventRequest,
    tx_hash: str | None = None,
) -> None:
    # Check if event already exists - skip if it does
    if Event.objects.filter(id=event_data.id).exists():
        log.info("Event %s already exists, skipping", event_data.id)
        return

    creator, _ = CyberValleyUser.objects.get_or_create(address=event_data.creator)
    place = EventPlace.objects.get(id=event_data.event_place_id)
    cid = _multihash2cid(event_data)
    data = _get_ipfs_json_with_retry(cid)
    log.info("data=%s", data)
    socials = _get_ipfs_json_with_retry(data["socialsCid"])
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
        creation_tx_hash=tx_hash,
    )

    send_notification(
        user=creator,
        title="Event request sent",
        body=f"Title: {event.title}",
    )
    if place.provider:
        send_notification(
            user=place.provider,
            title="New event request",
            body=f"Title: {event.title}. From {socials['network']}: {socials['value']}",
        )


@transaction.atomic
def _sync_event_updated(event_data: CyberValleyEventManager.EventUpdated) -> None:
    event = Event.objects.get(id=event_data.id)
    place = EventPlace.objects.get(id=event_data.event_place_id)

    cid = _multihash2cid(event_data)
    data = _get_ipfs_json_with_retry(cid)
    socials = _get_ipfs_json_with_retry(data["socialsCid"])

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
        send_notification(
            user=user,
            title="Event updated",
            body=f"Title: {event.title}",
        )


@transaction.atomic
def _sync_new_event_place_request(
    event_data: CyberValleyEventManager.NewEventPlaceRequest,
) -> None:
    requester, _ = CyberValleyUser.objects.get_or_create(address=event_data.requester)

    cid = _multihash2cid(event_data)
    data = _get_ipfs_json_with_retry(cid)

    # Create event place in Submitted state (provider is not set yet)
    place, created = EventPlace.objects.get_or_create(
        id=event_data.id,
        defaults={
            "provider": None,
            "title": data["title"],
            "geometry": data["geometry"],
            "max_tickets": event_data.max_tickets,
            "min_tickets": event_data.min_tickets,
            "min_price": event_data.min_price,
            "min_days": event_data.min_days,
            "days_before_cancel": event_data.days_before_cancel,
            "available": event_data.available,
        },
    )

    if created:
        log.info(
            "Event place request %s submitted by %s",
            event_data.id,
            event_data.requester,
        )
        send_notification(
            user=requester,
            title="Event place request submitted",
            body=f"Title: {place.title}",
        )


def _map_eventplace_status(status_int: int) -> str:
    status_mapping = {
        0: "submitted",
        1: "approved",
        2: "declined",
    }
    return status_mapping.get(status_int, "submitted")


@transaction.atomic
def _sync_event_place_updated(
    event_data: CyberValleyEventManager.EventPlaceUpdated,
) -> None:
    provider, _ = CyberValleyUser.objects.get_or_create(address=event_data.provider)

    place, created = EventPlace.objects.get_or_create(
        id=event_data.event_place_id,
        defaults={
            "provider": provider,
            "title": "",
            "geometry": {},
            "max_tickets": event_data.max_tickets,
            "min_tickets": event_data.min_tickets,
            "min_price": event_data.min_price,
            "min_days": event_data.min_days,
            "days_before_cancel": event_data.days_before_cancel,
            "available": event_data.available,
            "status": _map_eventplace_status(event_data.status),
        },
    )

    cid = _multihash2cid(event_data)
    data = _get_ipfs_json_with_retry(cid)

    place.provider = provider
    place.title = data["title"]
    place.geometry = data["geometry"]
    place.max_tickets = event_data.max_tickets
    place.min_tickets = event_data.min_tickets
    place.min_price = event_data.min_price
    place.min_days = event_data.min_days
    place.days_before_cancel = event_data.days_before_cancel
    place.available = event_data.available
    place.status = _map_eventplace_status(event_data.status)
    if hasattr(event_data, "event_deposit_size"):
        place.event_deposit_size = event_data.event_deposit_size
    place.save()

    if created:
        log.info("Event place %s was created", event_data.event_place_id)
    else:
        log.info("Event place %s was updated", event_data.event_place_id)

    if place.provider is not None:
        action = "created" if created else "updated"
        send_notification(
            user=place.provider,
            title=f"Event place {action}",
            body=f"Title: {place.title}",
        )


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(ipfshttpclient.exceptions.ProtocolError),
    before_sleep=before_sleep_log(log, logging.WARNING),
)
def _fetch_ticket_metadata(cid: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """Fetch ticket metadata from IPFS with retry logic.

    Supports both old ticket metadata format and new order metadata format.
    """
    ticket_meta = _get_ipfs_json_with_retry(cid)

    # Check if this is new order metadata format (has order_type field)
    if ticket_meta.get("order_type") == "ticket_purchase":
        # New format: socials is under buyer.socials (as CID)
        socials_cid = ticket_meta["buyer"]["socials"]
        socials = _get_ipfs_json_with_retry(socials_cid)
    elif isinstance(ticket_meta.get("socials"), dict):
        # Old format: socials is stored directly as a dict
        socials = ticket_meta["socials"]
    elif isinstance(ticket_meta.get("socials"), str):
        # Old format: socials is stored as a CID
        socials = _get_ipfs_json_with_retry(ticket_meta["socials"])
    else:
        log.warning(
            "Unknown socials format in ticket metadata: %s", ticket_meta.get("socials")
        )
        socials = {}
    return ticket_meta, socials


@transaction.atomic
def _sync_ticket_minted(event_data: CyberValleyEventTicket.TicketMinted) -> None:
    # FIXME: Fix this try_catch
    try:
        event = Event.objects.get(id=event_data.event_id)
    except Event.DoesNotExist:
        log.exception(
            "Event %s not found for ticket minting, skipping", event_data.event_id
        )
        return
    owner, _ = CyberValleyUser.objects.get_or_create(address=event_data.owner)

    cid = _multihash2cid(event_data)
    if cid is None:
        log.error(
            "Failed to extract CID from event data for event %s", event_data.event_id
        )
        return
    ticket_meta, socials = _fetch_ticket_metadata(cid)

    with suppress(IntegrityError), transaction.atomic():
        UserSocials.objects.create(
            user=owner, network=socials["network"], value=socials["value"]
        )

    log.info(
        "Saving ticket for event %s, owner %s from event %s", event, owner, event_data
    )

    # Category is required - every ticket must have a category
    try:
        category = TicketCategory.objects.get(
            event=event, category_id=event_data.category_id
        )
    except TicketCategory.DoesNotExist:
        log.exception(
            "Category %s not found for event %s - skipping ticket",
            event_data.category_id,
            event_data.event_id,
        )
        return

    ticket, created = Ticket.objects.get_or_create(
        id=str(event_data.ticket_id),
        defaults={
            "event": event,
            "owner": owner,
            "category": category,
        },
    )

    if created:
        event.tickets_bought += 1
        event.total_revenue += event.ticket_price
        event.save(update_fields=["tickets_bought", "total_revenue"])

        # Update category counter
        category.tickets_bought += 1
        category.save(update_fields=["tickets_bought"])

        # Create referral record if valid referral data provided
        _create_referral_record(event, ticket, owner, event_data.referral_data)

        send_notification(
            user=owner,
            title="Your ticket minted",
            body=(
                f"A new ticket with id {event_data.ticket_id} "
                f"has been minted for event {event.title}."
            ),
        )
        log.info(
            "Ticket %s created for event %s", event_data.ticket_id, event_data.event_id
        )
    else:
        log.info("Ticket %s already exists, skipping", event_data.ticket_id)


def _create_referral_record(
    event: Event,
    ticket: Ticket,
    referee: CyberValleyUser,
    referral_data: str,
) -> None:
    """Create a referral record if referral_data contains a valid referrer address."""
    from cyber_valley.events.models import Referral

    # Skip if referral_data is empty
    if not referral_data or referral_data.strip() == "":
        return

    # Validate that referral_data is a valid Ethereum address (0x prefix + 40 hex chars)
    referral_data = referral_data.strip().lower()
    if not referral_data.startswith("0x") or len(referral_data) != 42:
        log.warning("Invalid referral address format: %s", referral_data)
        return

    try:
        # Check if it's a valid hex address
        int(referral_data[2:], 16)
    except ValueError:
        log.warning("Invalid referral address (not hex): %s", referral_data)
        return

    # Skip self-referrals
    if referral_data == referee.address.lower():
        log.info("Self-referral detected, skipping for ticket %s", ticket.id)
        return

    # Get or create referrer user
    referrer, _ = CyberValleyUser.objects.get_or_create(address=referral_data)

    # Create referral record (idempotent - uses get_or_create)
    Referral.objects.get_or_create(
        ticket=ticket,
        defaults={
            "event": event,
            "referrer": referrer,
            "referee": referee,
        },
    )
    log.info(
        "Referral created: %s referred %s for event %s",
        referrer.address,
        referee.address,
        event.id,
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
    send_notification(
        user=event.creator,
        title="Event status updated",
        body=f"Event {event.title}. New status: {new_status}",
    )

    # Notify provider
    if event.place.provider:
        body = f"Event {event.title}. New status: {new_status}"
        send_notification(
            user=event.place.provider,
            title="Event status updated",
            body=body,
        )


@transaction.atomic
def _sync_ticket_redeemed(event_data: CyberValleyEventTicket.TicketRedeemed) -> None:
    ticket = Ticket.objects.get(id=event_data.ticket_id)

    ticket.is_redeemed = True
    ticket.save()

    send_notification(
        user=ticket.owner,
        title="Ticket redeemed",
        body=f"Event {ticket.event.title}",
    )


def _send_pending_verifications_to_new_provider(user: CyberValleyUser) -> None:
    """Send all pending verification requests to a newly created local provider."""
    telegram_social = user.socials.filter(network=UserSocials.Network.TELEGRAM).first()

    if not telegram_social:
        log.info(
            "New local provider %s has no telegram linked, "
            "skipping pending verifications",
            user.address,
        )
        return

    # Defensive: telegram_social.value should be numeric chat_id
    # Production stores: value="<chat_id>", metadata={"username": "@handle"}
    try:
        chat_id = int(telegram_social.value)
    except ValueError:
        log.warning(
            "Invalid telegram chat_id format for local provider %s: %s "
            "(expected numeric, got username?)",
            user.address,
            telegram_social.value,
        )
        return

    username = (
        telegram_social.metadata.get("username") if telegram_social.metadata else None
    )

    log.info(
        "Sending pending verification requests to new local provider %s", user.address
    )

    send_all_pending_verifications_to_provider(chat_id=chat_id, username=username)


@transaction.atomic
def _sync_role_granted(
    event_data: CyberValleyEventManager.RoleGranted
    | CyberValleyEventTicket.RoleGranted
    | DynamicRevenueSplitter.RoleGranted,
) -> None:
    if event_data.role in ("DEFAULT_ADMIN_ROLE", "BACKEND_ROLE", "ADMIN_ROLE"):
        return

    user_role_name = ROLE_MAPPING.get(event_data.role)
    if user_role_name is None:
        msg = f"Unknown role {event_data.role} in RoleGranted event"
        raise ValueError(msg)

    user, created = CyberValleyUser.objects.get_or_create(address=event_data.account)

    # Get or create the Role object
    role, _ = Role.objects.get_or_create(name=user_role_name)

    # Add role to user's roles (M2M relationship handles duplicates)
    user.roles.add(role)

    send_notification(
        user=user,
        title="Role granted",
        body=f"{user_role_name} granted to you",
    )

    # Notify admins with the new role
    admins = CyberValleyUser.objects.filter(
        roles__name__in=[CyberValleyUser.LOCAL_PROVIDER, CyberValleyUser.MASTER]
    ).distinct()
    for admin in admins:
        if user.address == admin.address:
            continue
        send_notification(
            user=admin,
            title="Role granted",
            body=f"{user_role_name} granted to {user.address}",
        )

    # Send all pending verification requests to newly created LOCAL_PROVIDER
    if user_role_name == CyberValleyUser.LOCAL_PROVIDER:
        _send_pending_verifications_to_new_provider(user)


@transaction.atomic
def _sync_role_revoked(
    event_data: CyberValleyEventManager.RoleRevoked
    | CyberValleyEventTicket.RoleRevoked
    | DynamicRevenueSplitter.RoleRevoked,
) -> None:
    if event_data.role in ("DEFAULT_ADMIN_ROLE", "BACKEND_ROLE", "ADMIN_ROLE"):
        return

    revoked_role_name = ROLE_MAPPING.get(event_data.role)
    if revoked_role_name is None:
        msg = f"Unknown role {event_data.role} in RoleRevoked event"
        raise ValueError(msg)

    # If LOCAL_PROVIDER is revoked, transfer all their EventPlaces to Master
    if event_data.role == "LOCAL_PROVIDER_ROLE":
        _transfer_event_places_to_master(event_data.account)

    user, created = CyberValleyUser.objects.get_or_create(address=event_data.account)

    # Remove the role from user's roles (M2M)
    role_to_remove = Role.objects.filter(name=revoked_role_name).first()
    if role_to_remove:
        user.roles.remove(role_to_remove)

    send_notification(
        user=user,
        title="Role revoked",
        body=f"{revoked_role_name} role was revoked",
    )
    admins = CyberValleyUser.objects.filter(
        roles__name__in=[CyberValleyUser.LOCAL_PROVIDER, CyberValleyUser.MASTER]
    ).distinct()
    for admin in admins:
        if user.address == admin.address:
            continue
        send_notification(
            user=admin,
            title="Role revoked",
            body=f"{revoked_role_name} role was revoked from {user.address}",
        )


def _transfer_event_places_to_master(local_provider_address: str) -> None:
    """Transfer all EventPlaces from a LocalProvider to the Master."""
    # Get the Master user using M2M roles
    master_user = CyberValleyUser.objects.filter(
        roles__name=CyberValleyUser.MASTER
    ).first()

    if not master_user:
        log.warning(
            "No Master user found in database, cannot transfer EventPlaces from %s",
            local_provider_address,
        )
        return

    # Get the LocalProvider user using M2M roles
    try:
        local_provider = CyberValleyUser.objects.get(
            address=local_provider_address, roles__name=CyberValleyUser.LOCAL_PROVIDER
        )
    except CyberValleyUser.DoesNotExist:
        log.warning(
            "LocalProvider %s not found in database, cannot transfer EventPlaces",
            local_provider_address,
        )
        return

    # Transfer all EventPlaces
    event_places = EventPlace.objects.filter(provider=local_provider)
    transferred_count = event_places.update(provider=master_user)

    if transferred_count > 0:
        log.info(
            "Transferred %d EventPlaces from LocalProvider %s to Master %s",
            transferred_count,
            local_provider_address,
            master_user.address,
        )
        send_notification(
            user=master_user,
            title="Event Places Transferred",
            body=f"{transferred_count} event places were transferred to you from "
            f"revoked LocalProvider {local_provider_address}",
        )


def _sync_revenue_distributed(evt: DynamicRevenueSplitter.RevenueDistributed) -> None:
    event = Event.objects.get(id=evt.event_id)
    send_notification(
        user=event.creator,
        title="Revenue distributed",
        body=(
            "Revenue for event "
            f"{event.title} was distributed. Total amount: {evt.amount}"
        ),
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


def _sync_ticket_category_created(
    event_data: CyberValleyEventManager.TicketCategoryCreated,
) -> None:
    # Event might not exist yet (TicketCategoryCreated can be emitted before NewEventRequest)
    # Skip and let error handling retry later
    try:
        event = Event.objects.get(id=event_data.event_id)
    except Event.DoesNotExist:
        log.warning(
            "Event %s not found for category %s - will retry later",
            event_data.event_id,
            event_data.category_id,
        )
        raise

    TicketCategory.objects.update_or_create(
        event=event,
        category_id=event_data.category_id,
        defaults={
            "name": event_data.name,
            "discount": event_data.discount_percentage,
            "quota": event_data.quota if event_data.has_quota else 0,
            "has_quota": event_data.has_quota,
        },
    )


def _sync_ticket_category_updated(
    event_data: CyberValleyEventManager.TicketCategoryUpdated,
) -> None:
    try:
        category = TicketCategory.objects.get(
            category_id=event_data.category_id,
            event_id=event_data.event_id,
        )
    except TicketCategory.DoesNotExist:
        log.warning(
            "Category %s for event %s not found, skipping update",
            event_data.category_id,
            event_data.event_id,
        )
        return

    category.name = event_data.name
    category.discount = event_data.discount_percentage
    category.quota = event_data.quota if event_data.has_quota else 0
    category.has_quota = event_data.has_quota
    category.save(update_fields=["name", "discount", "quota", "has_quota"])


# ============================================================================
# Distribution Profile Sync Functions
# ============================================================================


@transaction.atomic
def _sync_distribution_profile_created(
    event_data: DynamicRevenueSplitter.DistributionProfileCreated,
) -> None:
    """Handle DistributionProfileCreated event from contract."""
    owner, _ = CyberValleyUser.objects.get_or_create(address=event_data.owner.lower())

    # Build recipients list with shares
    recipients = [
        {"address": addr.lower(), "share": share}
        for addr, share in zip(event_data.recipients, event_data.shares, strict=False)
    ]

    DistributionProfile.objects.update_or_create(
        id=event_data.profile_id,
        defaults={
            "owner": owner,
            "recipients": recipients,
            "is_active": True,
        },
    )

    log.info(
        "DistributionProfile %s created/updated for owner %s",
        event_data.profile_id,
        owner.address,
    )

    # Send notification to owner
    _send_distribution_profile_notification(
        owner, event_data.profile_id, recipients, is_owner=True
    )

    # Send notifications to all recipients (excluding owner if they're also a recipient)
    owner_address_lower = owner.address.lower()
    for recipient_data in recipients:
        recipient_address = recipient_data["address"]
        if recipient_address != owner_address_lower:
            with suppress(CyberValleyUser.DoesNotExist):
                recipient_user = CyberValleyUser.objects.get(
                    address=recipient_address
                )
                _send_distribution_profile_notification(
                    recipient_user,
                    event_data.profile_id,
                    recipients,
                    is_owner=False,
                )


def _send_distribution_profile_notification(
    user: CyberValleyUser,
    profile_id: int,
    recipients: list[dict[str, Any]],
    is_owner: bool,
) -> None:
    """Send notification about distribution profile creation."""
    title = "Distribution Profile Created"
    if is_owner:
        body = (
            f"You have created distribution profile #{profile_id}. "
            f"It contains {len(recipients)} recipient(s) and can now be used "
            f"for event revenue sharing."
        )
    else:
        body = (
            f"You have been added as a recipient in distribution profile #{profile_id}. "
            f"You will receive a share of revenue when this profile is used for events."
        )

    notification = send_notification(user, title, body)
    if notification:
        log.info(
            "Sent distribution profile notification to user %s for profile %s",
            user.address,
            profile_id,
        )


@transaction.atomic
def _sync_distribution_profile_updated(
    event_data: DynamicRevenueSplitter.DistributionProfileUpdated,
) -> None:
    """Handle DistributionProfileUpdated event from contract."""
    try:
        profile = DistributionProfile.objects.get(id=event_data.profile_id)
    except DistributionProfile.DoesNotExist:
        log.warning(
            "DistributionProfile %s not found for update, skipping",
            event_data.profile_id,
        )
        return

    # Build recipients list with shares
    recipients = [
        {"address": addr.lower(), "share": share}
        for addr, share in zip(event_data.recipients, event_data.shares, strict=False)
    ]

    profile.recipients = recipients
    profile.save(update_fields=["recipients", "updated_at"])

    log.info("DistributionProfile %s updated", event_data.profile_id)


@transaction.atomic
def _sync_profile_ownership_transferred(
    event_data: DynamicRevenueSplitter.ProfileOwnershipTransferred,
) -> None:
    """Handle ProfileOwnershipTransferred event from contract."""
    try:
        profile = DistributionProfile.objects.get(id=event_data.profile_id)
    except DistributionProfile.DoesNotExist:
        log.warning(
            "DistributionProfile %s not found for ownership transfer, skipping",
            event_data.profile_id,
        )
        return

    new_owner, _ = CyberValleyUser.objects.get_or_create(
        address=event_data.new_owner.lower()
    )

    profile.owner = new_owner
    profile.save(update_fields=["owner", "updated_at"])

    log.info(
        "DistributionProfile %s ownership transferred to %s",
        event_data.profile_id,
        new_owner.address,
    )


@transaction.atomic
def _sync_all_profiles_transferred(
    event_data: DynamicRevenueSplitter.AllProfilesTransferred,
) -> None:
    """Handle bulk profile transfer when LocalProvider is revoked."""
    new_owner, _ = CyberValleyUser.objects.get_or_create(address=event_data.to.lower())

    updated_count = DistributionProfile.objects.filter(
        owner__address=event_data.from_addr.lower()
    ).update(owner=new_owner)

    log.info(
        "Transferred %d distribution profiles from %s to %s",
        updated_count,
        event_data.from_addr,
        event_data.to,
    )


@transaction.atomic
def _sync_profile_deactivated(
    event_data: DynamicRevenueSplitter.ProfileDeactivated,
) -> None:
    """Handle ProfileDeactivated event from contract."""
    try:
        profile = DistributionProfile.objects.get(id=event_data.profile_id)
    except DistributionProfile.DoesNotExist:
        log.warning(
            "DistributionProfile %s not found for deactivation, skipping",
            event_data.profile_id,
        )
        return

    profile.is_active = False
    profile.save(update_fields=["is_active", "updated_at"])

    log.info("DistributionProfile %s deactivated", event_data.profile_id)


@transaction.atomic
def _sync_event_profile_set(
    event_data: DynamicRevenueSplitter.EventProfileSet,
) -> None:
    """Handle EventProfileSet event from contract."""
    try:
        event = Event.objects.get(id=event_data.event_id)
    except Event.DoesNotExist:
        log.warning(
            "Event %s not found for profile assignment, skipping",
            event_data.event_id,
        )
        return

    try:
        profile = DistributionProfile.objects.get(id=event_data.profile_id)
    except DistributionProfile.DoesNotExist:
        log.warning(
            "DistributionProfile %s not found for event %s assignment, skipping",
            event_data.profile_id,
            event_data.event_id,
        )
        return

    event.distribution_profile = profile
    event.save(update_fields=["distribution_profile"])

    log.info(
        "Event %s assigned distribution profile %s",
        event_data.event_id,
        event_data.profile_id,
    )
