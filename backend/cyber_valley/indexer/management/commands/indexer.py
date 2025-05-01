import asyncio
import logging
from argparse import ArgumentParser
from collections.abc import Iterable
from queue import Queue
from typing import Any, Final, NoReturn

import pyshen
from django.conf import settings
from django.core.management.base import BaseCommand
from tenacity import after_log, before_log, retry, wait_fixed
from web3 import AsyncWeb3, WebSocketProvider
from web3.types import LogReceipt

log = logging.getLogger(__name__)

SUPPORTED_CONTRACTS: Final = (
    {
        "EventManager": "",
        "EventTicket": "",
    },
)


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
        provider = WebSocketProvider(settings.ETH_NODE_ENDPOINT)
        queue: Queue[LogReceipt] = Queue()
        listener_loop = pyshen.aext.create_event_loop_thread()
        listener_fut = pyshen.aext.run_coro_in_thread(
            arun_listeners(provider, queue, SUPPORTED_CONTRACTS[0].values()),
            listener_loop,
        )
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
            queue.put(payload)
    raise NodeListenerStoppedError
