import asyncio
import logging
from argparse import ArgumentParser
from collections.abc import Iterable
from dataclasses import dataclass
from queue import Queue
from typing import Any, Final, NoReturn

import pyshen
from django.conf import settings
from django.core.management.base import BaseCommand
from tenacity import after_log, before_log, retry, wait_fixed
from web3 import AsyncWeb3, Web3, WebSocketProvider
from web3.contract import Contract
from web3.types import LogReceipt

log = logging.getLogger(__name__)


@dataclass
class SupportedContract:
    contract: Contract
    abi: dict[str, Any]


SUPPORTED_ADDRESSES: Final = ("0x1", "0x2")


class Command(BaseCommand):
    help = "Listens to smart contract events and indexes data into the database."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--from-block",
            type=int,
            help="Start syncing from this block number (overrides last saved block).",
            default=None,
        )
        parser.add_argument(
            "--no-sync",
            action="store_true",
            help="Skip historical sync and only listen for new events.",
        )

    def handle(self, *_args: list[Any], **_options: dict[str, Any]) -> None:
        pyshen.logging.setup()
        w3 = Web3(Web3.HTTPProvider(settings.ETH_NODE_HOST))

        contracts: dict[str, Contract] = {}
        for address in SUPPORTED_ADDRESSES:
            abi_path = settings.ABI_BASE_PATH / f"{address}.json"
            contract = w3.eth.contract(address=address, abi=abi_path.read_text())
            contracts[address] = contract

        provider = WebSocketProvider(settings.ETH_NODE_HOST)
        queue: Queue[LogReceipt] = Queue()
        listener_loop = pyshen.aext.create_event_loop_thread()
        listener_fut = pyshen.aext.run_coro_in_thread(
            arun_listeners(provider, queue, SUPPORTED_ADDRESSES),
            listener_loop,
        )
        while receipt := queue.get():
            try:
                process_contract_log(receipt, contracts)
            except Exception:
                log.exception("Failed to process log receipt %s", receipt)
                # TODO: Save failed to process event & notify
        listener_fut.result()


class NodeListenerStoppedError(Exception):
    pass


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


def process_contract_log(
    log_receipt: LogReceipt, contracts: dict[str, Contract]
) -> None:
    raise NotImplementedError


def decode_log(log_receipt: LogReceipt, contract_abi: dict[str, Any]) -> Any:
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
