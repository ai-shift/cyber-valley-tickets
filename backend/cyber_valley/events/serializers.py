from rest_framework import serializers

from .models import Event, EventPlace


class EventPlaceSerializer(serializers.HyperlinkedModelSerializer[EventPlace]):
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


class EventSerializer(serializers.HyperlinkedModelSerializer[Event]):
    class Meta:
        model = Event
        fields = (
            "title",
            "description",
            "event_place",
            "ticket_price",
            "cancel_date",
            "start_date",
            "days_amount",
            "status",
            "image_url",
            "created_at",
            "updated_at",
        )
