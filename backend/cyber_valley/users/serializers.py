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
        fields = ("address", "role", "tickets", "socials")
        read_only_fields = fields

    @extend_schema_field(SaveSocialsSerializer(many=True))
    def get_socials(self, obj: CyberValleyUser) -> list[dict[str, str]]:
        return [{"network": s.network, "value": s.value} for s in obj.socials.all()]


class StaffSerializer(serializers.ModelSerializer[CyberValleyUser]):
    class Meta:
        model = CyberValleyUser
        fields = ("address",)
        read_only_fields = fields


class UploadSocialsSerializer(serializers.ModelSerializer[UserSocials]):
    class Meta:
        model = UserSocials
        fields = ("network", "value")
