from typing import Any

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from cyber_valley.events.ticket_serializer import TicketSerializer

from .models import CyberValleyUser, UserSocials


class SocialSerializer(serializers.Serializer[Any]):
    network = serializers.ChoiceField(choices=UserSocials.Network.choices)
    value = serializers.CharField()


class SaveSocialsSerializer(serializers.ModelSerializer[UserSocials]):
    class Meta:
        model = UserSocials
        fields = ("network", "value")


class CurrentUserSerializer(serializers.ModelSerializer[CyberValleyUser]):
    tickets = TicketSerializer(many=True, read_only=True)
    socials = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    class Meta:
        model = CyberValleyUser
        fields = ("address", "role", "roles", "tickets", "socials", "default_share")
        read_only_fields = fields

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_roles(self, obj: CyberValleyUser) -> list[str]:
        return list(obj.roles.values_list("name", flat=True))

    @extend_schema_field(SocialSerializer(many=True))
    def get_socials(self, obj: CyberValleyUser) -> list[dict[str, str]]:
        socials = []
        for s in obj.socials.all():
            value: str = s.value
            # For telegram, use username from metadata or "no username"
            if s.network == UserSocials.Network.TELEGRAM:
                username = s.metadata.get("username") if s.metadata else None
                value = username or "no username"
            socials.append({"network": s.network, "value": value})
        return socials


class StaffSerializer(serializers.ModelSerializer[CyberValleyUser]):
    socials = serializers.SerializerMethodField()

    class Meta:
        model = CyberValleyUser
        fields = ("address", "socials")
        read_only_fields = fields

    @extend_schema_field(SocialSerializer(many=True))
    def get_socials(self, obj: CyberValleyUser) -> list[dict[str, Any]]:
        socials = []
        for s in obj.socials.all():
            value: str = s.value
            if s.network == UserSocials.Network.TELEGRAM:
                username = s.metadata.get("username") if s.metadata else None
                value = username or "no username"
            socials.append({"network": s.network, "value": value})
        return socials


class UploadSocialsSerializer(serializers.ModelSerializer[UserSocials]):
    class Meta:
        model = UserSocials
        fields = ("network", "value")
