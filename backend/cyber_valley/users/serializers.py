from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from cyber_valley.events.ticket_serializer import TicketSerializer

from .models import CyberValleyUser, UserSocials


class SaveSocialsSerializer(serializers.ModelSerializer[UserSocials]):
    class Meta:
        model = UserSocials
        fields = ("network", "value")


class CurrentUserSerializer(serializers.ModelSerializer[CyberValleyUser]):
    tickets = TicketSerializer(many=True, read_only=True)
    socials = serializers.SerializerMethodField()

    class Meta:
        model = CyberValleyUser
        fields = ("address", "role", "tickets", "socials", "default_share")
        read_only_fields = fields

    @extend_schema_field(SaveSocialsSerializer(many=True))
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
    class Meta:
        model = CyberValleyUser
        fields = ("address",)
        read_only_fields = fields


class UploadSocialsSerializer(serializers.ModelSerializer[UserSocials]):
    class Meta:
        model = UserSocials
        fields = ("network", "value")
