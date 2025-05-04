import uuid
from argparse import ArgumentParser
from datetime import timedelta
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from cyber_valley.events.models import Event, EventPlace, Ticket
from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser


class Command(BaseCommand):
    help = "Seeds the database with mock data for development."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Flush existing data before seeding.",
        )

    def handle(self, *_args: list[Any], **options: dict[str, Any]) -> None:  # noqa: PLR0915
        self.stdout.write("Seeding database...")

        if options["flush"]:
            self.stdout.write("Flushing existing data...")
            # Order matters due to foreign keys
            Notification.objects.all().delete()
            Ticket.objects.all().delete()
            Event.objects.all().delete()
            EventPlace.objects.all().delete()
            CyberValleyUser.objects.all().delete()
            self.stdout.write("Data flushed.")

        with transaction.atomic():
            # --- Create Master User ---
            master_address = "0x7cAFfEf233EF9c30688844fC2C4048469011FFe1"
            master_user, created = CyberValleyUser.objects.get_or_create(
                address=master_address,
                defaults={"role": CyberValleyUser.MASTER, "is_active": True},
            )
            if created:
                self.stdout.write(f"Created Master User: {master_user.address}")
            else:
                self.stdout.write(f"Master User already exists: {master_user.address}")

            # --- Create Event Places ---
            self.stdout.write("Creating Event Places...")
            place1, created1 = EventPlace.objects.get_or_create(
                id=1,
                defaults={
                    "title": "Cyber Hub Arena",
                    "max_tickets": 150,
                    "min_tickets": 25,
                    "min_price": 10,
                    "min_days": 3,
                    "days_before_cancel": 2,
                    "available": True,
                },
            )
            self.stdout.write(f"{'Created' if created1 else 'Exists'}: {place1.title}")

            place2, created2 = EventPlace.objects.get_or_create(
                id=2,
                defaults={
                    "title": "Digital Oasis Center",
                    "max_tickets": 80,
                    "min_tickets": 15,
                    "min_price": 15,
                    "min_days": 2,
                    "days_before_cancel": 1,
                    "available": True,
                },
            )
            self.stdout.write(f"{'Created' if created2 else 'Exists'}: {place2.title}")

            place3, created3 = EventPlace.objects.get_or_create(
                id=3,
                defaults={
                    "title": "The Virtual Sphere",
                    "max_tickets": 300,
                    "min_tickets": 50,
                    "min_price": 8,
                    "min_days": 5,
                    "days_before_cancel": 3,
                    "available": False,
                },
            )
            self.stdout.write(f"{'Created' if created3 else 'Exists'}: {place3.title}")

            # --- Create Notifications for Master User ---
            self.stdout.write("Creating Notifications...")

            notif1, c_notif1 = Notification.objects.get_or_create(
                user=master_user,
                title="System Welcome",
                defaults={
                    "body": "Welcome to the CyberValley platform!",
                    "seen_at": None,
                    "created_at": timezone.now(),
                },
            )
            self.stdout.write(f"{'Created' if c_notif1 else 'Exists'}: {notif1.title}")

            notif2, c_notif2 = Notification.objects.get_or_create(
                user=master_user,
                title="New Feature Alert",
                body="Check out the new dashboard features.",
                defaults={
                    "seen_at": timezone.now(),
                    "created_at": timezone.now() - timedelta(hours=1),
                },  # Example seen
            )
            self.stdout.write(f"{'Created' if c_notif2 else 'Exists'}: {notif2.title}")

            notif3, c_notif3 = Notification.objects.get_or_create(
                user=master_user,
                title="Event Approval Request",
                defaults={
                    "body": "An event is awaiting your approval.",
                    "seen_at": None,
                    "created_at": timezone.now() - timedelta(days=1),
                },
            )
            self.stdout.write(f"{'Created' if c_notif3 else 'Exists'}: {notif3.title}")

            notif4, c_notif4 = Notification.objects.get_or_create(
                user=master_user,
                title="Reminder: Review Pending Events",
                defaults={
                    "body": "You have outstanding events to review.",
                    "seen_at": None,
                    "created_at": timezone.now() - timedelta(days=2),
                },
            )
            self.stdout.write(f"{'Created' if c_notif4 else 'Exists'}: {notif4.title}")

            notif5, c_notif5 = Notification.objects.get_or_create(
                user=master_user,
                title="Important Security Notice",
                defaults={
                    "body": "Please update your password soon.",
                    "seen_at": timezone.now(),
                    "created_at": timezone.now() - timedelta(minutes=30),
                },  # Seen recently
            )
            self.stdout.write(f"{'Created' if c_notif5 else 'Exists'}: {notif5.title}")

            # --- Create Events ---
            self.stdout.write("Creating Events...")
            now = timezone.now()

            event1, c_event1 = Event.objects.get_or_create(
                title="Grand Opening of Cyber Hub",
                creator=master_user,  # Lookup fields
                defaults={
                    "place": place1,
                    "ticket_price": 25,
                    "tickets_bought": 0,  # Start with 0 tickets bought
                    "start_date": now + timedelta(days=10),
                    "days_amount": 1,
                    "status": Event.STATUS_CHOICES["approved"],
                    "description": "Celebrate the opening of our new arena!",
                    "image_url": None,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            self.stdout.write(f"{'Created' if c_event1 else 'Exists'}: {event1.title}")

            event2, c_event2 = Event.objects.get_or_create(
                title="Digital Marketing Summit 2024",
                creator=master_user,  # Lookup fields
                defaults={
                    "place": place2,
                    "ticket_price": 150,
                    "tickets_bought": 0,
                    "start_date": now + timedelta(days=15),
                    "days_amount": 2,
                    "status": Event.STATUS_CHOICES["submitted"],
                    "description": "Learn about the latest digital marketing trends.",
                    "image_url": "https://picsum.photos/1920/1080",
                    "created_at": now,
                    "updated_at": now,
                },
            )
            self.stdout.write(f"{'Created' if c_event2 else 'Exists'}: {event2.title}")

            event3, c_event3 = Event.objects.get_or_create(
                title="Virtual Reality Expo",
                creator=master_user,  # Lookup fields
                defaults={
                    "place": place1,
                    "ticket_price": 50,
                    "tickets_bought": 0,
                    "start_date": now + timedelta(days=20),
                    "days_amount": 3,
                    "status": Event.STATUS_CHOICES["approved"],
                    "description": "Explore the future of VR technology.",
                    "image_url": None,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            self.stdout.write(f"{'Created' if c_event3 else 'Exists'}: {event3.title}")

            event4, c_event4 = Event.objects.get_or_create(
                title="Cybersecurity Workshop",
                creator=master_user,  # Lookup fields
                defaults={
                    "place": place2,
                    "ticket_price": 75,
                    "tickets_bought": 0,
                    "start_date": now + timedelta(days=25),
                    "days_amount": 1,
                    "status": Event.STATUS_CHOICES["declined"],
                    "description": (
                        "Hands-on workshop for protecting your digital assets."
                    ),
                    "image_url": "https://picsum.photos/1920/1080",
                    "created_at": now,
                    "updated_at": now,
                },
            )
            self.stdout.write(f"{'Created' if c_event4 else 'Exists'}: {event4.title}")

            event5, c_event5 = Event.objects.get_or_create(
                title="Networking Mixer",
                creator=master_user,  # Lookup fields
                defaults={
                    "place": place3,
                    "ticket_price": 30,
                    "tickets_bought": 0,
                    "start_date": now + timedelta(days=30),
                    "days_amount": 1,
                    "status": Event.STATUS_CHOICES["cancelled"],
                    "description": "Meet and greet with industry professionals.",
                    "image_url": None,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            self.stdout.write(f"{'Created' if c_event5 else 'Exists'}: {event5.title}")

            # Store created/existing events for ticket creation
            created_or_existing_events = [event1, event2, event3, event4, event5]

            # --- Create a unique user and a ticket for each event ---
            self.stdout.write("Creating unique users and tickets for events...")
            for i, event in enumerate(created_or_existing_events):
                # Generate a unique address for each user
                user_address = f"0xTestUserTicket{(i + 1):04d}{uuid.uuid4().hex[:6]}"

                # Create or get the unique user for this event
                ticket_owner, user_created = CyberValleyUser.objects.get_or_create(
                    address=user_address,
                    defaults={
                        "role": CyberValleyUser.CUSTOMER,
                        "is_active": True,
                    },
                )
                if user_created:
                    self.stdout.write(f"  Created Ticket User: {ticket_owner.address}")
                else:
                    self.stdout.write(
                        f"  Ticket User already exists: {ticket_owner.address}"
                    )

                ticket, ticket_created = Ticket.objects.get_or_create(
                    event=event,
                    owner=ticket_owner,
                    defaults={
                        "id": (
                            f"TKT-{event.id}-{ticket_owner.address[:6]}"
                            f"-{uuid.uuid4().hex[:8]}",
                        ),
                        "is_redeemed": False,
                    },
                )
                if ticket_created:
                    self.stdout.write(
                        f"  Created Ticket {ticket.id} for Event '{event.title}'"
                    )
                    # Increment tickets_bought on the event if a new ticket was created
                    event.tickets_bought += 1
                    event.save()
                else:
                    self.stdout.write(
                        f"  Ticket for Event '{event.title}'"
                        f" and User {ticket_owner.address} already exists."
                    )

        self.stdout.write(self.style.SUCCESS("Database seeding complete."))
