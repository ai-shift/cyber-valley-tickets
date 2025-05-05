from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.core.files import File
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer
from rest_framework import serializers

from cyber_valley.users.models import CyberValleyUser as UserType

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
            "start_date_timestamp",
        )

    def get_start_date_timestamp(self, obj: Event) -> int:
        return int(obj.start_date.timestamp()) * 1000


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            name="Default",
            response_only=True,
        ),
    ]
)
class StaffEventSerializer(EventSerializer):
    cancel_date_timestamp = serializers.IntegerField(required=True)
    tickets_required_until_cancel = serializers.SerializerMethodField(allow_null=False)

    class Meta:
        model = EventSerializer.Meta.model
        fields = (
            *EventSerializer.Meta.fields,
            "tickets_bought",
            "cancel_date_timestamp",
            "tickets_required_until_cancel",
        )

    def to_representation(self, obj: Event) -> dict[str, Any]:
        data = super().to_representation(obj)
        data["tickets_bought"] = obj.tickets_bought
        data["cancel_date_timestamp"] = (
            obj.created_at - timedelta(days=obj.place.days_before_cancel)
        ).timestamp() * 1000
        return data

    def get_tickets_required_until_cancel(self, obj: Event) -> int:
        return max(obj.tickets_bought - obj.place.min_tickets, 0)


class CreatorEventSerializer(StaffEventSerializer):
    tickets_bought = serializers.IntegerField(allow_null=True)
    cancel_date_timestamp = serializers.IntegerField(allow_null=True)
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
        assert isinstance(user, User)
        return obj.creator.address == user.address


class TicketSerializer(serializers.ModelSerializer[Ticket]):
    event_id = serializers.IntegerField(source="event")

    class Meta:
        model = Ticket
        fields = ("id", "event_id", "is_redeemed")
        read_only_fields = fields


@dataclass
class EventMetaData:
    cover: File[bytes]
    title: str
    description: str


class UploadEventMetaToIpfsSerializer(serializers.Serializer[EventMetaData]):
    cover = serializers.FileField()
    title = serializers.CharField()
    description = serializers.CharField()

    def create(self, validated_data: dict[str, Any]) -> EventMetaData:
        return EventMetaData(**validated_data)
