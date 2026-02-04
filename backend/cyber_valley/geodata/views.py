import json
from typing import Any

from django.http import HttpResponse, JsonResponse
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.request import Request

from .models import GeodataLayer
from .serializers import GeoFeatureSerializer


class ErrorResponseSerializer(serializers.Serializer[Any]):
    error = serializers.CharField()


class GeodataViewSet(viewsets.ViewSet):
    permission_classes = (AllowAny,)

    @extend_schema(
        operation_id="api_geodata_layers_list",
        summary="List available geodata layers",
        description="Returns a list of available geodata layer names",
        responses={200: serializers.ListSerializer(child=serializers.CharField())},
    )
    def list(self, _request: Request) -> JsonResponse:
        layers = GeodataLayer.objects.filter(is_active=True).values_list(
            "name", flat=True
        )
        return JsonResponse(list(layers), safe=False)

    @extend_schema(
        operation_id="api_geodata_layer_retrieve",
        summary="Get geodata layer by name",
        description=(
            "Returns the geodata features for a specific layer. "
            "Each feature represents a geographical area with coordinates, "
            "name, type, and optional styling information."
        ),
        parameters=[
            OpenApiParameter(
                name="id",
                type=str,
                location=OpenApiParameter.PATH,
                description="Geodata layer name",
            ),
        ],
        responses={
            200: GeoFeatureSerializer(many=True),
            404: ErrorResponseSerializer,
        },
    )
    def retrieve(
        self, _request: Request, pk: str | None = None
    ) -> HttpResponse | JsonResponse:
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
