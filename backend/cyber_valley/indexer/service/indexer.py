import logging
import pickle
import traceback
from dataclasses import dataclass
from functools import partial
from queue import Queue
from typing import Any, Final, NoReturn, cast

import pyshen
from django.conf import settings
from eth_typing import ChecksumAddress
from pydantic import BaseModel, ValidationError
from returns.pipeline import flow
from returns.pointfree import bind
from returns.result import Failure, Success, safe
from tenacity import before_sleep_log, retry, wait_fixed
from web3 import AsyncWeb3, Web3, WebSocketProvider
from web3.contract import Contract
from web3.exceptions import LogTopicError, MismatchedABI
from web3.types import LogReceipt, LogsSubscriptionArg

from ..models import LastProcessedBlock, LogProcessingError
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


def index_events(contracts: dict[ChecksumAddress, type[Contract]], sync: bool) -> None:
    provider = WebSocketProvider(settings.WS_ETH_NODE_HOST)
    queue: Queue[LogReceipt] = Queue()
    listener_loop = pyshen.aext.create_event_loop_thread()
    listener_fut = pyshen.aext.run_coro_in_thread(
        arun_listeners(provider, queue, list(contracts.keys())),
        listener_loop,
    )
    w3 = Web3(Web3.HTTPProvider(settings.HTTP_ETH_NODE_HOST))
    if sync:
        run_sync(
            w3,
            queue,
            list(contracts.keys()),
        )
    try_fix_errors(queue)
    deser_log = partial(parse_log, contracts=list(contracts.values()))
    while receipt := queue.get():
        tx_hash = "0x" + receipt["transactionHash"].hex()
        extra = {"tx_hash": tx_hash}
        log.info("Starting processing", extra=extra)
        result = flow(
            receipt,
            deser_log,
            bind(synchronize_event),
        )
        match result:
            case Success(_):
                log.info("Successfully processed", extra=extra)
                deleted, _ = LogProcessingError.objects.filter(tx_hash=tx_hash).delete()
                if deleted:
                    log.info("Successfully fixed error for %s", tx_hash)

            case Failure(error):
                log.error(
                    "Failed to process with %s",
                    traceback.format_exception(error),
                    extra=extra,
                )
                LogProcessingError.objects.update_or_create(
                    tx_hash=tx_hash,
                    defaults={
                        "block_number": receipt["blockNumber"],
                        "log_receipt": pickle.dumps(receipt),
                        "error": repr(error),
                    }
                )
        LastProcessedBlock.objects.update_or_create(
            defaults={"id": 1, "block_number": receipt["blockNumber"]}
        )

    listener_fut.result()


@retry(
    wait=wait_fixed(5),
    before_sleep=before_sleep_log(log, logging.ERROR),
)
async def arun_listeners(
    provider: WebSocketProvider,
    queue: Queue[LogReceipt],
    contract_addresses: list[ChecksumAddress],
) -> NoReturn:
    async with AsyncWeb3(provider) as w3:
        filter_params = LogsSubscriptionArg(address=contract_addresses)
        _subscription_id = await w3.eth.subscribe("logs", filter_params)
        async for payload in w3.socket.process_subscriptions():
            queue.put(payload["result"])
    raise NodeListenerStoppedError


def run_sync(
    w3: Web3, queue: Queue[LogReceipt], contract_addresses: list[ChecksumAddress]
) -> None:
    try:
        from_block = LastProcessedBlock.objects.get(id=1).block_number
    except LastProcessedBlock.DoesNotExist:
        from_block = 0
    for receipt in _get_logs(w3, from_block, contract_addresses):
        queue.put(receipt)


def try_fix_errors(queue: Queue[LogReceipt]) -> None:
    errors = LogProcessingError.objects.all()
    log.info("Got %s errors to fix", len(errors))
    for error in errors:
        log.info("Attempting to fix error from %s", error.tx_hash)
        queue.put(pickle.loads(error.log_receipt))  # noqa: S301


@dataclass
class EventNotRecognizedError(Exception):
    log_receipt: LogReceipt


@safe
def parse_log(log_receipt: LogReceipt, contracts: list[type[Contract]]) -> BaseModel:
    for contract in contracts:
        event_names = [abi["name"] for abi in contract.abi if abi["type"] == "event"]
        duplicated_event_names = {
            name for name in event_names if event_names.count(name) > 1
        }
        assert not duplicated_event_names, f"{duplicated_event_names=}"
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
                assert issubclass(event_model, BaseModel), (
                    f"Excpected BaseModel got {type(event_model)}"
                )
                try:  # Some events have the same names e.g. Transfer or Approval
                    return cast(type[BaseModel], event_model).model_validate(
                        event["args"]
                    )
                except (ValueError, ValidationError):
                    continue

    raise EventNotRecognizedError(log_receipt)


def _get_logs(
    w3: Web3, from_block: int, addresses: list[ChecksumAddress]
) -> list[LogReceipt]:
    to_block = w3.eth.block_number
    log.info("Getting logs for %s-%s blocks", from_block, to_block)
    entries = w3.eth.filter(
        {"fromBlock": from_block, "toBlock": to_block, "address": addresses}
    ).get_all_entries()
    log.info("Retreived %s logs", len(entries))
    return entries
