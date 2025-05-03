import asyncio
import logging
from collections.abc import Iterable
from dataclasses import dataclass
from queue import Queue
from typing import Any, NoReturn

import pyshen
from eth_typing import ChecksumAddress
from pydantic import BaseModel
from tenacity import after_log, before_log, retry, wait_fixed
from web3 import AsyncWeb3, Web3, WebSocketProvider
from web3.contract import Contract
from web3.exceptions import MismatchedABI
from web3.types import LogReceipt

log = logging.getLogger(__name__)


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


def parse_log(
    log_receipt: LogReceipt, contracts: list[type[Contract]]
) -> None | BaseModel:
    event = None
    for contract in contracts:
        event_names = [abi["name"] for abi in contract.abi if abi["type"] == "event"]
        assert len(event_names) == len(set(event_names))
        for event_name in event_names:
            try:
                decoded_log = getattr(contract.events, event_name).process_log(
                    log_receipt
                )
            except MismatchedABI:
                continue

            event = decoded_log
            break

    if event is None:
        log.warning("Failed to decode log")
        return None

    return event["event"]


def decode_log(log_receipt: LogReceipt, contract_abi: list[dict[str, Any]]) -> Any:
    event_signature_hash = log_receipt["topics"][0]
    w3 = Web3()

    for item in contract_abi:
        if item["type"] == "event":
            event_name = item["name"]
            input_types = ",".join([arg["type"] for arg in item["inputs"]])
            event_signature_text = f"{event_name}({input_types})"
            calculated_hash = w3.keccak(text=event_signature_text)

            if calculated_hash == event_signature_hash:
                # Found the event, now decode the data
                event = w3.eth.contract(abi=[item]).events[
                    event_name
                ]()  # Create a temporary contract for this event
                decoded_event = event.process_log(log_receipt)
                return event_name, decoded_event["args"]

    return None, None
