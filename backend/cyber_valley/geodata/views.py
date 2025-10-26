import json

from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import GeodataLayer


class GeodataViewSet(viewsets.ViewSet):
    permission_classes = (AllowAny,)

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
