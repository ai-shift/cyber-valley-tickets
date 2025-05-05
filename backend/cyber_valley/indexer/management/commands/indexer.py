import logging
from argparse import ArgumentParser
from typing import Any, Final

import pyshen
from django.core.management.base import BaseCommand

log = logging.getLogger(__name__)


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
