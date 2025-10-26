import json

from django.http import HttpResponse, JsonResponse
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, viewsets
from rest_framework.permissions import AllowAny

from .models import GeodataLayer


class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField()


class GeodataViewSet(viewsets.ViewSet):
    permission_classes = (AllowAny,)

    @extend_schema(
        summary="List available geodata layers",
        description="Returns a list of available geodata layer names",
        responses={200: serializers.ListSerializer(child=serializers.CharField())},
    )
    def list(self, request):
        layers = GeodataLayer.objects.filter(is_active=True).values_list("name", flat=True)
        return JsonResponse(list(layers), safe=False)

    @extend_schema(
        summary="Get geodata layer by name",
        description="Returns the GeoJSON data for a specific geodata layer",
        responses={
            200: {
                "type": "array",
                "items": {"type": "object"},
                "description": "GeoJSON feature collection for the requested layer",
            },
            404: ErrorResponseSerializer,
        },
    )
    def retrieve(self, request, pk=None):
        try:
            layer = GeodataLayer.objects.get(name=pk, is_active=True)
            return HttpResponse(
                json.dumps(layer.data),
                content_type="application/json",
            )
        except GeodataLayer.DoesNotExist:
            return JsonResponse(
                {"error": f"Geodata layer '{pk}' not found"},
                status=404,
            )
