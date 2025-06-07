import json
import os
import time
from argparse import ArgumentParser
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection
from web3 import Web3

EVENT_MANAGER_ADDRESS = os.environ["PUBLIC_EVENT_MANAGER_ADDRESS"]
EVENT_MANAGER_ABI = json.loads(settings.CONTRACTS_INFO[2].read_text())["abi"]


class Command(BaseCommand):
    help = r"Closes \ cancells events via polling DB."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--poll-interval",
            type=int,
            help=(
                "How frequently DB should be checked. In minutes\n"
                "It should be higher then worse ETH block calculation,"
                " otherwise double close \ cancel can happen"
            ),
            default=60,
        )

    def handle(self, *_args: list[Any], **options: Any) -> None:
        poll_interval = timedelta(minutes=options["poll_interval"])
        self.stdout.write(f"Starting reaper with {poll_interval=}")

        w3 = Web3(Web3.HTTPProvider(settings.HTTP_ETH_NODE_HOST))
        assert w3.is_connected()

        while True:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT e.id
                    FROM events_event e
                    INNER JOIN events_eventplace p ON e.place_id = p.id
                    WHERE e.status = 'approved'
                    AND now()::date + interval '1 day' * p.days_before_cancel
                      >= e.start_date::date
                    AND e.tickets_bought < p.min_tickets
                    """,
                )
                to_cancel = [row[0] for row in cursor.fetchall()]

                cursor.execute(
                    """
                    SELECT e.id
                    FROM events_event e
                    WHERE e.status = 'approved'
                    AND e.start_date::date + interval '1 day' * e.days_amount
                      < now()::date
                    """,
                )
                to_close = [row[0] for row in cursor.fetchall()]

            if to_cancel:
                self.stdout.write(f"Got {len(to_cancel)} events to cancel: {to_cancel}")

            if to_close:
                # Because of down time some events should be cancelled
                # but they'll be fetched with to_close events as well
                to_close = [i for i in to_close if i not in to_cancel]
                self.stdout.write(f"Got {len(to_close)} events to close: {to_close}")

            time.sleep(poll_interval.total_seconds())
