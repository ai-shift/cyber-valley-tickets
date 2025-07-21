from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Ticket

User = get_user_model()


class TicketSerializer(serializers.ModelSerializer[Ticket]):
    class Meta:
        model = Ticket
        fields = ("id", "event_id", "is_redeemed", "pending_is_redeemed")
        read_only_fields = fields
