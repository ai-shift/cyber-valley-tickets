from django.db import transaction
import asyncio
import logging
from collections.abc import Iterable
from dataclasses import dataclass
from functools import partial
from queue import Queue
from typing import Any, Final, NoReturn, cast

import pyshen
from eth_typing import ChecksumAddress
from pydantic import BaseModel
from returns.pipeline import flow
from returns.pointfree import bind
from returns.result import Failure, Success, safe
from tenacity import after_log, before_log, retry, wait_fixed
from web3 import AsyncWeb3, WebSocketProvider
from web3.contract import Contract
from web3.exceptions import LogTopicError, MismatchedABI
from web3.types import LogReceipt

from ..models import LastProcessedBlock
from ._sync import synchronize_event
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
    deser_log = partial(parse_log, contracts=list(contracts.values()))
    while receipt := queue.get():
        result = flow(
            receipt,
            deser_log,
            bind(synchronize_event),
        )
        match result:
            case Success(_):
                log.info("Successfully processed %s", receipt["topics"])
            case Failure(error):
                log.error("Failed to process %s with %s", receipt["topics"], error)
        LastProcessedBlock(block_number=receipt["blockNumber"]).save()
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
