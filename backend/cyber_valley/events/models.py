from typing import ClassVar

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class EventPlace(models.Model):
    id = models.IntegerField(primary_key=True)
    max_tickets = models.PositiveSmallIntegerField()
    min_tickets = models.PositiveSmallIntegerField()
    min_price = models.PositiveSmallIntegerField()
    min_days = models.PositiveSmallIntegerField()
    available = models.BooleanField(default=True)

    def __str__(self) -> str:
        return (
            f"Event Place {self.id} (Max: {self.max_tickets}, Min: {self.min_tickets})"
        )


class Event(models.Model):
    STATUS_CHOICES: ClassVar[dict[str, str]] = {
        "submitted": "Submitted",
        "approved": "Approved",
        "declined": "Declined",
        "cancelled": "Cancelled",
        "closed": "Closed",
    }

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")
    event_place = models.ForeignKey(EventPlace, on_delete=models.CASCADE)
    ticket_price = models.PositiveSmallIntegerField()
    cancel_date = models.DateTimeField()
    start_date = models.DateTimeField()
    days_amount = models.PositiveSmallIntegerField()
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="submitted"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    image_url = models.URLField(null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    def __str__(self) -> str:
        return self.title


class Ticket(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="tickets")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    ticket_id = models.CharField(max_length=255, unique=True)
    is_redeemed = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Ticket for {self.event.title} owned by {self.owner.username}"

    class Meta:
        unique_together = ("event", "owner")
