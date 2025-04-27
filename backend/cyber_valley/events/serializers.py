from rest_framework import serializers

from .models import EventPlace


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
