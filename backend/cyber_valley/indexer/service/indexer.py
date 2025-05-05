import asyncio
import logging
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime
from queue import Queue
from typing import Any, Final, NoReturn, cast

import pyshen
from django.utils import timezone
from eth_typing import ChecksumAddress
from pydantic import BaseModel
from returns.result import safe
from tenacity import after_log, before_log, retry, wait_fixed
from web3 import AsyncWeb3, WebSocketProvider
from web3.contract import Contract
from web3.exceptions import LogTopicError, MismatchedABI
from web3.types import LogReceipt

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser

from .events import CyberValleyEventManager, CyberValleyEventTicket, SimpleERC20Xylose

log = logging.getLogger(__name__)

_EVENTS_MODULES: Final = (
    CyberValleyEventManager,
    CyberValleyEventTicket,
    SimpleERC20Xylose,
)


@dataclass
class SupportedContract:
    contract: Contract
    abi: dict[str, Any]


class NodeListenerStoppedError(Exception):
    pass


def gather_events(
    queue: Queue[LogReceipt],
    eth_node_host: str,
    contracts: dict[ChecksumAddress, type[Contract]],
) -> None:
    provider = WebSocketProvider(eth_node_host)
    listener_loop = pyshen.aext.create_event_loop_thread()
    listener_fut = pyshen.aext.run_coro_in_thread(
        arun_listeners(provider, queue, contracts.keys()),
        listener_loop,
    )
    while receipt := queue.get():
        try:
            parse_log(receipt, list(contracts.values()))
        except Exception:
            log.exception("Failed to process log receipt %s", receipt)
            # TODO: Save failed to process event & notify
    listener_fut.result()


async def arun_listeners(
    provider: WebSocketProvider,
    queue: Queue[LogReceipt],
    contract_addresses: Iterable[str],
) -> NoReturn:
    await asyncio.gather(
        *[arun_listener(provider, queue, address) for address in contract_addresses],
    )
    raise NodeListenerStoppedError


@retry(
    wait=wait_fixed(5),
    before=before_log(log, logging.INFO),
    after=after_log(log, logging.ERROR),
    reraise=True,
)
async def arun_listener(
    provider: WebSocketProvider, queue: Queue[LogReceipt], contract_address: str
) -> NoReturn:
    log.info("Strting logs listener for %s", contract_address)
    async with AsyncWeb3(provider) as w3:
        filter_params = {"address": contract_address}
        _subscription_id = await w3.eth.subscribe("logs", filter_params)
        async for payload in w3.socket.process_subscriptions():
            queue.put(payload.result)
    raise NodeListenerStoppedError


@dataclass
class EventNotRecognizedError(Exception):
    log_receipt: LogReceipt


@safe
def parse_log(log_receipt: LogReceipt, contracts: list[type[Contract]]) -> BaseModel:
    for contract in contracts:
        event_names = [abi["name"] for abi in contract.abi if abi["type"] == "event"]
        assert len(event_names) == len(set(event_names))
        for event_name in event_names:
            try:
                event = getattr(contract.events, event_name).process_log(log_receipt)
            except (MismatchedABI, LogTopicError):
                continue

            for module in _EVENTS_MODULES:
                try:
                    event_model = getattr(module, event["event"])
                except AttributeError:
                    continue
                assert issubclass(event_model, BaseModel)
                try:  # Some events have the same names e.g. Transfer or Approval
                    return cast(type[BaseModel], event_model).model_validate(
                        event["args"]
                    )
                except ValueError:
                    continue

    raise EventNotRecognizedError(log_receipt)


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

    event.status = new_status
    event.save()


def _sync_ticket_redeemed(event_data: CyberValleyEventTicket.TicketRedeemed) -> None:
    ticket = Ticket.objects.get(id=event_data.ticket_id)

    ticket.is_redeemed = True
    ticket.save()
