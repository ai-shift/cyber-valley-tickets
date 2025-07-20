import uuid
from argparse import ArgumentParser
from datetime import timedelta
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.indexer.models import LastProcessedBlock, LogProcessingError
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = "Seeds the database with mock data for development."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Flush existing data before seeding.",
        )
        parser.add_argument(
            "--flush-only",
            action="store_true",
            help="Removes existing data without adding mocks",
        )

    def handle(self, *_args: list[Any], **options: dict[str, Any]) -> None:  # noqa: PLR0915
        self.stdout.write("Seeding database...")

        if options["flush"] or options["flush_only"]:
            self.stdout.write("Flushing existing data...")
            # Order matters due to foreign keys
            Notification.objects.all().delete()
            Ticket.objects.all().delete()
            Event.objects.all().delete()
            EventPlace.objects.all().delete()
            CyberValleyUser.objects.all().delete()
            LastProcessedBlock.objects.all().delete()
            LogProcessingError.objects.all().delete()
            self.stdout.write("Data flushed.")

        if options["flush_only"]:
            return

        users = [
            ("0x2789023F36933E208675889869c7d3914A422921", CyberValleyUser.MASTER),
            ("0x96e37a0cD915c38dE8B5aAC0db61eB7eB839CeeB", CyberValleyUser.CUSTOMER),
        ]
        with transaction.atomic():
            for address, role in users:
                u = CyberValleyUser.objects.create(
                    address=address,
                    role=role,
                    is_active=True,
                )
                Token.objects.create(user=u, key=address)
                self.stdout.write(f"Created {role} user: {address}")

        self.stdout.write(self.style.SUCCESS("Database seeding complete."))
