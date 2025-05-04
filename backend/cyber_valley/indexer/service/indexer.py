import asyncio
import importlib
import logging
import pkgutil
from collections.abc import Iterable
from dataclasses import dataclass
from queue import Queue
from typing import Any, NoReturn, cast

import pyshen
from eth_typing import ChecksumAddress
from pydantic import BaseModel
from returns.result import safe
from tenacity import after_log, before_log, retry, wait_fixed
from web3 import AsyncWeb3, WebSocketProvider
from web3.contract import Contract
from web3.exceptions import LogTopicError, MismatchedABI
from web3.types import LogReceipt

log = logging.getLogger(__name__)

_package_name = ".events"
_EVENTS_MODULES = [
    importlib.import_module(f"{_package_name}.{module_name}")
    for _, module_name, _ in pkgutil.walk_packages([_package_name])
]


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


class EventNotRecognizedError(Exception):
    pass


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
                event_model = getattr(module, event["event"])
                assert issubclass(event_model, BaseModel)
                try:  # Some events have the same names e.g. Transfer or Approval
                    return cast(type[BaseModel], event_model).model_validate(
                        event["args"]
                    )
                except ValueError:
                    continue

    raise EventNotRecognizedError
