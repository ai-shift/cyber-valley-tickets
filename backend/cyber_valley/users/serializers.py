from rest_framework import serializers

from cyber_valley.events.serializers import TicketSerializer

from .models import CyberValleyUser


class CurrentUserSerializer(serializers.ModelSerializer[CyberValleyUser]):
    tickets = TicketSerializer(many=True, read_only=True)

    class Meta:
        model = CyberValleyUser
        fields = ("address", "role", "tickets")
        read_only_fields = fields
