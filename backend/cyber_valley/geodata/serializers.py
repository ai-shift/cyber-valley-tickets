from typing import Any, ClassVar

from rest_framework import serializers

from .models import GeodataLayer


class GeodataLayerSerializer(serializers.ModelSerializer[GeodataLayer]):
    class Meta:
        model = GeodataLayer
        fields: ClassVar[list[str]] = ["data"]

    def to_representation(self, instance: GeodataLayer) -> Any:
        return instance.data
