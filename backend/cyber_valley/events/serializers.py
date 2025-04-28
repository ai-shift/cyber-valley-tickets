from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from cyber_valley.users.models import CyberValleyUser as UserType

from .models import Event, EventPlace

User = get_user_model()


class EventPlaceSerializer(serializers.ModelSerializer[EventPlace]):
    class Meta:
        model = EventPlace
        fields = (
            "id",
            "max_tickets",
            "min_tickets",
            "min_price",
            "min_days",
            "days_before_cancel",
            "available",
        )


class CreatorSerializer(serializers.ModelSerializer[UserType]):
    class Meta:
        model = User
        fields = ("address",)


class EventSerializer(serializers.ModelSerializer[Event]):
    event_place = EventPlaceSerializer()
    creator = CreatorSerializer()
    cancel_date = serializers.DateTimeField()

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
            "created_at",
            "updated_at",
        )


class StaffEventSerializer(EventSerializer):
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
        data["cancel_date"] = instance.created_at - timedelta(
            days=instance.place.days_before_cancel
        )
        return data


class CreatorEventSerializer(StaffEventSerializer):
    cancel_date = serializers.DateTimeField(required=False)
    tickets_bought = serializers.IntegerField(required=False)

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
