from typing import ClassVar

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class EventPlace(models.Model):
    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=200, null=False)
    max_tickets = models.PositiveSmallIntegerField(null=False)
    min_tickets = models.PositiveSmallIntegerField(null=False)
    min_price = models.PositiveSmallIntegerField(null=False)
    min_days = models.PositiveSmallIntegerField(null=False)
    days_before_cancel = models.PositiveSmallIntegerField(null=False)
    available = models.BooleanField(null=False, default=True)

    def __str__(self) -> str:
        return (
            f"Event Place {self.id} (Max: {self.max_tickets}, Min: {self.min_tickets})"
        )


class Event(models.Model):
    STATUS_CHOICES: ClassVar[dict[str, str]] = {
        "submitted": "submitted",
        "approved": "approved",
        "declined": "declined",
        "cancelled": "cancelled",
        "closed": "closed",
    }

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")
    place = models.ForeignKey(EventPlace, on_delete=models.CASCADE, null=False)
    ticket_price = models.PositiveSmallIntegerField(null=False)
    tickets_bought = models.PositiveSmallIntegerField(null=False)
    start_date = models.DateTimeField(null=False)
    days_amount = models.PositiveSmallIntegerField(null=False)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="submitted", null=False
    )
    title = models.CharField(max_length=200, null=False)
    description = models.TextField(null=False)
    image_url = models.URLField(null=True)
    created_at = models.DateTimeField(null=False)
    updated_at = models.DateTimeField(null=False)

    def __str__(self) -> str:
        return self.title


class Ticket(models.Model):
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="tickets", null=False
    )
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="tickets", null=False
    )
    id = models.CharField(max_length=255, primary_key=True)
    is_redeemed = models.BooleanField(default=False, null=False)

    def __str__(self) -> str:
        return f"Ticket for {self.event.title} owned by {self.owner.address}"

    class Meta:
        unique_together = ("event", "owner")
