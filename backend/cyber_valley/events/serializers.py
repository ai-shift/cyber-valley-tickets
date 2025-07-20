from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.core.files import File
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer
from rest_framework import serializers

from cyber_valley.users.models import CyberValleyUser as UserType
from cyber_valley.users.models import UserSocials
from cyber_valley.users.serializers import UploadSocialsSerializer

from .models import Event, EventPlace, Ticket

User = get_user_model()


class EventPlaceSerializer(serializers.ModelSerializer[EventPlace]):
    is_used = serializers.SerializerMethodField()

    class Meta:
        model = EventPlace
        fields = (
            "id",
            "title",
            "max_tickets",
            "min_tickets",
            "min_price",
            "min_days",
            "location_url",
            "days_before_cancel",
            "available",
            "is_used",
        )

    def get_is_used(self, obj: EventPlace) -> bool:
        return obj.event_set.exclude(status__in=["closed", "cancelled"]).exists()


class CreatorSerializer(serializers.ModelSerializer[UserType]):
    class Meta:
        model = User
        fields = ("address",)


class EventSerializer(serializers.ModelSerializer[Event]):
    place = EventPlaceSerializer(required=True)
    creator = CreatorSerializer(required=True)
    start_date_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "creator",
            "status",
            "title",
            "description",
            "place",
            "ticket_price",
            "days_amount",
            "image_url",
            "website",
            "start_date_timestamp",
            "tickets_bought",
        )

    def get_start_date_timestamp(self, obj: Event) -> int:
        return int(obj.start_date.timestamp())


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            name="Default",
            response_only=True,
        ),
    ]
)
class StaffEventSerializer(EventSerializer):
    cancel_date_timestamp = serializers.SerializerMethodField()
    tickets_required_until_cancel = serializers.SerializerMethodField(allow_null=False)

    class Meta:
        model = EventSerializer.Meta.model
        fields = (
            *EventSerializer.Meta.fields,
            "tickets_required_until_cancel",
            "cancel_date_timestamp",
        )

    def to_representation(self, obj: Event) -> dict[str, Any]:
        data = super().to_representation(obj)
        data["tickets_bought"] = obj.tickets_bought
        return data

    def get_tickets_required_until_cancel(self, obj: Event) -> int:
        return max(obj.tickets_bought - obj.place.min_tickets, 0)

    def get_cancel_date_timestamp(self, obj: Event) -> int:
        return int(
            (obj.start_date - timedelta(days=obj.place.days_before_cancel)).timestamp()
        )


class CreatorEventSerializer(StaffEventSerializer):
    tickets_bought = serializers.IntegerField(allow_null=True)
    cancel_date_timestamp = serializers.SerializerMethodField(allow_null=True)
    tickets_required_until_cancel = serializers.SerializerMethodField(allow_null=True)

    class Meta:
        model = StaffEventSerializer.Meta.model
        fields = StaffEventSerializer.Meta.fields

    def to_representation(self, obj: Event) -> dict[str, Any]:
        data = super().to_representation(obj)
        if self.should_provide_sensitive(obj):
            return data
        # Keep only public fields
        for field in self.Meta.fields:
            if field in EventSerializer.Meta.fields:
                continue
            data[field] = None

        return data

    def should_provide_sensitive(self, obj: Event) -> bool:
        user = self.context["request"].user
        if isinstance(user, User):
            return obj.creator.address == user.address
        return False


@dataclass
class EventMetaData:
    cover: "File[bytes]"
    title: str
    website: str
    description: str
    socials_cid: str


class UploadEventMetaToIpfsSerializer(serializers.Serializer[EventMetaData]):
    cover = serializers.FileField()
    title = serializers.CharField()
    description = serializers.CharField()
    website = serializers.CharField()
    socials_cid = serializers.CharField()

    def create(self, validated_data: dict[str, Any]) -> EventMetaData:
        return EventMetaData(**validated_data)


@dataclass
class PlaceMetaData:
    title: str
    location_url: str


class UploadPlaceMetaToIpfsSerializer(serializers.Serializer[PlaceMetaData]):
    title = serializers.CharField()
    location_url = serializers.CharField()

    def create(self, validated_data: dict[str, Any]) -> PlaceMetaData:
        return PlaceMetaData(**validated_data)


@dataclass
class TicketMetaData:
    socials: UserSocials
    eventid: int


class UploadTicketMetaToIpfsSerializer(serializers.Serializer[TicketMetaData]):
    socials = UploadSocialsSerializer()
    eventid = serializers.IntegerField()

    def create(self, validated_data: dict[str, Any]) -> TicketMetaData:
        return TicketMetaData(**validated_data)


class TicketSerializer(serializers.Serializer[Ticket]):
    class Meta:
        model = Ticket
        fields = ("is_redeemed", "pending_is_redeemed")
