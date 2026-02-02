from argparse import ArgumentParser
from datetime import timedelta
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from rest_framework.authtoken.models import Token

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.indexer.models import LastProcessedBlock, LogProcessingError
from cyber_valley.notifications.models import Notification
from cyber_valley.shaman_verification.models import VerificationRequest
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
                Token.objects.create(user=u)
                self.stdout.write(f"Created {role} user: {address}")

                # Add socials for master (2 socials), local provider,
                # and first customer (1 social)
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
                elif role == CyberValleyUser.LOCAL_PROVIDER:
                    UserSocials.objects.create(
                        user=u,
                        network=UserSocials.Network.TELEGRAM,
                        value="@local_provider_bali",
                    )
                    self.stdout.write("  Added 1 social for local provider")
                elif role == CyberValleyUser.CUSTOMER and idx == 1:
                    UserSocials.objects.create(
                        user=u,
                        network=UserSocials.Network.TELEGRAM,
                        value="@first_customer",
                    )
                    self.stdout.write("  Added 1 social for first customer")

        # Create shaman verification requests
        self.stdout.write("Creating shaman verification requests...")

        # Get week dates
        today = timezone.now()
        days_since_monday = today.weekday()
        current_monday = today - timedelta(days=days_since_monday)
        current_monday = current_monday.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        previous_monday = current_monday - timedelta(weeks=1)

        # Get customer user for verification requests
        customer_user = CyberValleyUser.objects.get(
            address="0x96e37a0cD915c38dE8B5aAC0db61eB7eB839CeeB"
        )

        # Previous week shaman verifications
        shamans_prev_week = [
            {
                "metadata_cid": "QmPrev1Individual",
                "verification_type": VerificationRequest.VerificationType.INDIVIDUAL,
                "status": VerificationRequest.Status.APPROVED,
                "created_at": previous_monday + timedelta(days=1, hours=10),
                "updated_at": previous_monday + timedelta(days=2, hours=10),  # 24 hours
            },
            {
                "metadata_cid": "QmPrev2Company",
                "verification_type": VerificationRequest.VerificationType.COMPANY,
                "status": VerificationRequest.Status.APPROVED,
                "created_at": previous_monday + timedelta(days=3, hours=14),
                "updated_at": previous_monday + timedelta(days=5, hours=14),  # 48 hours
            },
            {
                "metadata_cid": "QmPrev3Declined",
                "verification_type": VerificationRequest.VerificationType.INDIVIDUAL,
                "status": VerificationRequest.Status.DECLINED,
                "created_at": previous_monday + timedelta(days=4, hours=9),
                "updated_at": previous_monday + timedelta(days=4, hours=21),  # 12 hours
            },
            {
                "metadata_cid": "QmPrev4Pending",
                "verification_type": VerificationRequest.VerificationType.COMPANY,
                "status": VerificationRequest.Status.PENDING,
                "created_at": previous_monday + timedelta(days=5, hours=11),
                "updated_at": previous_monday + timedelta(days=5, hours=11),
            },
        ]

        # Current week shaman verifications
        shamans_current_week = [
            {
                "metadata_cid": "QmCurr1Individual",
                "verification_type": VerificationRequest.VerificationType.INDIVIDUAL,
                "status": VerificationRequest.Status.APPROVED,
                "created_at": current_monday + timedelta(days=1, hours=9),
                "updated_at": current_monday + timedelta(days=1, hours=15),  # 6 hours
            },
            {
                "metadata_cid": "QmCurr2Company",
                "verification_type": VerificationRequest.VerificationType.COMPANY,
                "status": VerificationRequest.Status.APPROVED,
                "created_at": current_monday + timedelta(days=2, hours=10),
                "updated_at": current_monday + timedelta(days=3, hours=10),  # 24 hours
            },
            {
                "metadata_cid": "QmCurr3Individual",
                "verification_type": VerificationRequest.VerificationType.INDIVIDUAL,
                "status": VerificationRequest.Status.APPROVED,
                "created_at": current_monday + timedelta(days=2, hours=14),
                "updated_at": current_monday + timedelta(days=2, hours=20),  # 6 hours
            },
            {
                "metadata_cid": "QmCurr4Declined",
                "verification_type": VerificationRequest.VerificationType.INDIVIDUAL,
                "status": VerificationRequest.Status.DECLINED,
                "created_at": current_monday + timedelta(days=3, hours=11),
                "updated_at": current_monday + timedelta(days=3, hours=23),  # 12 hours
            },
            {
                "metadata_cid": "QmCurr5Pending",
                "verification_type": VerificationRequest.VerificationType.COMPANY,
                "status": VerificationRequest.Status.PENDING,
                "created_at": current_monday + timedelta(days=4, hours=13),
                "updated_at": current_monday + timedelta(days=4, hours=13),
            },
        ]

        # Create all shaman verification requests
        for shaman_data in shamans_prev_week + shamans_current_week:
            metadata_cid = str(shaman_data["metadata_cid"])
            verification_type = str(shaman_data["verification_type"])
            status = str(shaman_data["status"])
            created_at = shaman_data["created_at"]
            updated_at = shaman_data["updated_at"]

            VerificationRequest.objects.create(
                metadata_cid=metadata_cid,
                verification_type=verification_type,
                status=status,
                requester=customer_user,
            )
            # Update timestamps after creation
            VerificationRequest.objects.filter(metadata_cid=metadata_cid).update(
                created_at=created_at,
                updated_at=updated_at,
            )
            self.stdout.write(f"Created shaman verification: {metadata_cid} ({status})")
            # Update timestamps after creation
            VerificationRequest.objects.filter(metadata_cid=metadata_cid).update(
                created_at=created_at,
                updated_at=updated_at,
            )
            self.stdout.write(f"Created shaman verification: {metadata_cid} ({status})")

        self.stdout.write(self.style.SUCCESS("Database seeding complete."))
