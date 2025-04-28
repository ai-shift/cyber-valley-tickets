from typing import Any

from rest_framework import serializers

from .models import Event, EventPlace


class EventPlaceSerializer(serializers.ModelSerializer[EventPlace]):
    class Meta:
        model = EventPlace
        fields = (
            "id",
            "max_tickets",
            "min_tickets",
            "min_price",
            "min_days",
            "available",
        )


class EventSerializer(serializers.ModelSerializer[Event]):
    event_place = EventPlaceSerializer()

    class Meta:
        model = Event
        fields = (
            "id",
            "status",
            "title",
            "description",
            "event_place",
            "ticket_price",
            "cancel_date",
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
        user = self.context["request"].user
        if instance.creator == user:
            data["status"] = instance.status
            data["tickets_bought"] = instance.tickets_bought
            data["cancel_date"] = instance.cancel_date
        return data
