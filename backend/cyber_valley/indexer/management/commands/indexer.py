import logging
from argparse import ArgumentParser
from typing import Any

import pyshen
from django.conf import settings
from django.core.management.base import BaseCommand
from eth_typing import ChecksumAddress, HexAddress, HexStr
from web3 import Web3

from cyber_valley.indexer.service.indexer import index_events

log = logging.getLogger(__name__)


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
            "--sync",
            action="store_true",
            help="Sync blocks from last saved in db to the present one.",
            default=True,
        )

    def handle(self, *_args: list[Any], **options: dict[str, Any]) -> None:
        pyshen.logging.setup()
        w3 = Web3(Web3.HTTPProvider(f"http://{settings.ETH_NODE_HOST}"))
        assert w3.is_connected()
        contracts = {
            ChecksumAddress(HexAddress(HexStr(address))): w3.eth.contract(abi=abi)
            for address, abi in settings.ETH_CONTRACT_ADDRESS_TO_ABI.items()
        }
        index_events(settings.ETH_NODE_HOST, contracts, bool(options["sync"]))
