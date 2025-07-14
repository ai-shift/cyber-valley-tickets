from rest_framework import serializers

from cyber_valley.events.ticket_serializer import TicketSerializer

from .models import CyberValleyUser, UserSocials


class CurrentUserSerializer(serializers.ModelSerializer[CyberValleyUser]):
    tickets = TicketSerializer(many=True, read_only=True)

    class Meta:
        model = CyberValleyUser
        fields = ("address", "role", "tickets")
        read_only_fields = fields


class StaffSerializer(serializers.ModelSerializer[CyberValleyUser]):
    class Meta:
        model = CyberValleyUser
        fields = ("address",)
        read_only_fields = fields


class UploadSocialsSerializer(serializers.ModelSerializer[UserSocials]):
    class Meta:
        model = UserSocials
        fields = ("network", "value")
