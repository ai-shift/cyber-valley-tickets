import json
import logging
import os
from argparse import ArgumentParser
from typing import Any, Final

from django.conf import settings
from django.core.management.base import BaseCommand
from eth_typing import ChecksumAddress, HexAddress, HexStr
from web3 import Web3

from cyber_valley.indexer.service.indexer import index_events

log = logging.getLogger(__name__)

ETH_CONTRACT_ADDRESS_TO_ABI: Final = {
    adr: json.loads(path.read_text())["abi"]
    for adr, path in {
        os.environ["EVENT_TICKET_ADDRESS"]: settings.CONTRACTS_INFO[1],
        os.environ["EVENT_MANAGER_ADDRESS"]: settings.CONTRACTS_INFO[2],
    }.items()
}


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
            help="Sync blocks from last saved in db to the present one.",
        )

    def handle(self, *_args: list[Any], **options: dict[str, Any]) -> None:
        w3 = Web3(Web3.HTTPProvider(settings.HTTP_ETH_NODE_HOST))
        assert w3.is_connected()
        contracts = {
            ChecksumAddress(HexAddress(HexStr(address))): w3.eth.contract(abi=abi)
            for address, abi in ETH_CONTRACT_ADDRESS_TO_ABI.items()
        }
        index_events(contracts, not bool(options["no_sync"]))
