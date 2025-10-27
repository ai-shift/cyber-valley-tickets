from typing import Any, ClassVar

from rest_framework import serializers

from .models import GeodataLayer


class CoordinateSerializer(serializers.Serializer[Any]):
    lat = serializers.FloatField(help_text="Latitude coordinate")
    lng = serializers.FloatField(help_text="Longitude coordinate")


class GeoFeatureSerializer(serializers.Serializer[Any]):
    name = serializers.CharField(help_text="Name of the geographical feature")
    type = serializers.CharField(help_text="Type of the feature (e.g., polygon, point)")
    coordinates = CoordinateSerializer(
        many=True, help_text="List of coordinate points defining the feature"
    )
    polygon_color = serializers.CharField(
        required=False, help_text="RGBA hex color for the polygon fill (e.g., 24589d0f)"
    )
    line_color = serializers.CharField(
        required=False,
        help_text="RGBA hex color for the polygon border (e.g., ff589d0f)",
    )


class GeodataLayerSerializer(serializers.ModelSerializer[GeodataLayer]):
    class Meta:
        model = GeodataLayer
        fields: ClassVar[list[str]] = ["data"]

    def to_representation(self, instance: GeodataLayer) -> Any:
        return instance.data
