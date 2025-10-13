from argparse import ArgumentParser
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
from rest_framework.authtoken.models import Token

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.indexer.models import LastProcessedBlock, LogProcessingError
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser, UserSocials


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

    def handle(self, *_args: list[Any], **options: dict[str, Any]) -> None:
        self.stdout.write("Seeding database...")

        if options["flush"] or options["flush_only"]:
            self.stdout.write("Flushing existing data...")
            # Order matters due to foreign keys
            Notification.objects.all().delete()
            Ticket.objects.all().delete()
            Event.objects.all().delete()
            EventPlace.objects.all().delete()
            UserSocials.objects.all().delete()
            CyberValleyUser.objects.all().delete()
            LastProcessedBlock.objects.all().delete()
            LogProcessingError.objects.all().delete()
            self.stdout.write("Data flushed.")

        if options["flush_only"]:
            return

        users = [
            ("0x2789023F36933E208675889869c7d3914A422921", CyberValleyUser.MASTER),
            ("0x96e37a0cD915c38dE8B5aAC0db61eB7eB839CeeB", CyberValleyUser.CUSTOMER),
            ("0xA84036A18ecd8f4F3D21ca7f85BEcC033571b15e", CyberValleyUser.CUSTOMER),
            ("0x7617b92b06c4ce513c53Df1c818ed25f95475f69", CyberValleyUser.CUSTOMER),
            (
                "0x9772d9a6A104c162b97767e6a654Be54370A042F",
                CyberValleyUser.LOCAL_PROVIDER,
            ),
        ]
        with transaction.atomic():
            for idx, (address, role) in enumerate(users):
                u = CyberValleyUser.objects.create(
                    address=address,
                    role=role,
                    is_active=True,
                )
                Token.objects.create(user=u, key=address)
                self.stdout.write(f"Created {role} user: {address}")

                # Add socials for master (2 socials) and first customer (1 social)
                if role == CyberValleyUser.MASTER:
                    UserSocials.objects.create(
                        user=u,
                        network=UserSocials.Network.TELEGRAM,
                        value="@cybervalley_master",
                    )
                    UserSocials.objects.create(
                        user=u,
                        network=UserSocials.Network.DISCORD,
                        value="cybervalley#1234",
                    )
                    self.stdout.write("  Added 2 socials for master user")
                elif role == CyberValleyUser.CUSTOMER and idx == 1:
                    UserSocials.objects.create(
                        user=u,
                        network=UserSocials.Network.TELEGRAM,
                        value="@first_customer",
                    )
                    self.stdout.write("  Added 1 social for first customer")

        self.stdout.write(self.style.SUCCESS("Database seeding complete."))
