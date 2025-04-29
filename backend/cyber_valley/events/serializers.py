from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from cyber_valley.users.models import CyberValleyUser as UserType

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
    event_place = EventPlaceSerializer(required=True)
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
            "event_place",
            "ticket_price",
            "start_date",
            "days_amount",
            "image_url",
        )

    def to_representation(self, instance: Event) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["start_date"] = data["start_date"].timestamp() * 100
        return data


class StaffEventSerializer(EventSerializer):
    cancel_date = serializers.IntegerField(required=True)

    class Meta:
        model = EventSerializer.Meta.model
        fields = (
            *EventSerializer.Meta.fields,
            "tickets_bought",
            "cancel_date",
        )

    def to_representation(self, instance: Event) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["tickets_bought"] = instance.tickets_bought
        data["cancel_date"] = (
            instance.created_at - timedelta(days=instance.place.days_before_cancel)
        ).timestamp() * 1000

        return data


class CreatorEventSerializer(StaffEventSerializer):
    tickets_bought = serializers.IntegerField(required=False)
    cancel_date = serializers.IntegerField(required=False)

    class Meta:
        model = StaffEventSerializer.Meta.model
        fields = StaffEventSerializer.Meta.fields

    def to_representation(self, instance: Event) -> dict[str, Any]:
        data = super().to_representation(instance)
        user = self.context["request"].user
        if instance.creator != user:
            data["tickets_bought"] = None
            data["cancel_date"] = None
        return data
