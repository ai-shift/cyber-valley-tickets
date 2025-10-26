from rest_framework import serializers

from .models import GeodataLayer


class GeodataLayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeodataLayer
        fields = ["data"]

    def to_representation(self, instance):
        return instance.data
