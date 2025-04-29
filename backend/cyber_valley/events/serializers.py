from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer
from rest_framework import serializers

from django.contrib.auth.models import User as UserType

from .models import Event, EventPlace

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
    start_date = serializers.IntegerField(required=True)

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
            "start_date",
            "days_amount",
            "image_url",
        )

    def to_representation(self, instance: Event) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["start_date"] = data["start_date"].timestamp() * 100
        return data


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            name="Default",
            response_only=True,
        ),
    ]
)
class StaffEventSerializer(EventSerializer):
    cancel_date = serializers.IntegerField(required=True)
    tickets_required_until_cancel = serializers.SerializerMethodField(allow_null=False)

    class Meta:
        model = EventSerializer.Meta.model
        fields = (
            *EventSerializer.Meta.fields,
            "tickets_bought",
            "cancel_date",
            "tickets_required_until_cancel",
        )

    def to_representation(self, instance: Event) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["tickets_bought"] = instance.tickets_bought
        data["cancel_date"] = (
            instance.created_at - timedelta(days=instance.place.days_before_cancel)
        ).timestamp() * 1000

        return data

    def get_tickets_required_until_cancel(self, obj: Event) -> int:
        return max(obj.tickets_bought - obj.place.min_tickets, 0)


class CreatorEventSerializer(StaffEventSerializer):
    tickets_bought = serializers.IntegerField(allow_null=True)
    cancel_date = serializers.IntegerField(allow_null=True)
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
