import json
import os
import time
from argparse import ArgumentParser
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection
from eth_account import Account
from eth_account.signers.local import LocalAccount
from eth_typing import (
    ChecksumAddress,
    HexAddress,
    HexStr,
)
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder

EVENT_MANAGER_ADDRESS = ChecksumAddress(
    HexAddress(HexStr(os.environ["PUBLIC_EVENT_MANAGER_ADDRESS"]))
)
EVENT_MANAGER_ABI = json.loads(settings.CONTRACTS_INFO[2].read_text())["abi"]
PRIVATE_KEY = os.environ.get("BACKEND_EOA_PRIVATE_KEY")


class Command(BaseCommand):
    help = r"Closes \ cancells events via polling DB."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--poll-interval",
            type=int,
            help=(
                "How frequently DB should be checked. In minutes\n"
                "It should be higher then worse ETH block calculation,"
                r" otherwise double close \ cancel can happen"
            ),
            default=60,
        )

    def handle(self, *_args: list[Any], **options: Any) -> None:
        poll_interval = timedelta(minutes=options["poll_interval"])
        self.stdout.write(f"Starting reaper with {poll_interval=}")

        w3 = Web3(Web3.HTTPProvider(settings.HTTP_ETH_NODE_HOST))
        assert w3.is_connected()

        account: LocalAccount = Account.from_key(PRIVATE_KEY)
        w3.eth.default_account = account.address
        w3.middleware_onion.inject(
            SignAndSendRawMiddlewareBuilder.build(account), layer=0
        )
        self.stdout.write(f"Imported {account.address} EOA")

        contract = w3.eth.contract(abi=EVENT_MANAGER_ABI, address=EVENT_MANAGER_ADDRESS)
        self.stdout.write(f"Will interact with {EVENT_MANAGER_ADDRESS}")

        while True:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT e.id, e.status
                    FROM events_event e
                    INNER JOIN events_eventplace p ON e.place_id = p.id
                    WHERE e.status in ('approved', 'submitted')
                    AND now()::date + interval '1 day' * p.days_before_cancel
                      >= e.start_date::date
                    AND e.tickets_bought < p.min_tickets
                    """,
                )
                to_cancel = cursor.fetchall()

            if to_cancel:
                self.stdout.write(f"Got {len(to_cancel)} events to cancel: {to_cancel}")
                for event_id, status in to_cancel:
                    tx: Any
                    match status:
                        case "approved":
                            tx = contract.functions.cancelEvent(event_id)
                        case "submitted":
                            tx = contract.functions.declineEvent(event_id)
                        case _:
                            self.stderr.write(f"unexpected event {status=}")
                            raise ValueError

                    try:
                        tx.transact()
                    except Exception as e:
                        self.stderr.write(
                            f"Failed to exeucte {tx=} {event_id=} with {e}"
                        )

            time.sleep(poll_interval.total_seconds())
