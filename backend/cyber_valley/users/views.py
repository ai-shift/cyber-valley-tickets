from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import CyberValleyUser
from .serializers import CurrentUserSerializer


class CurrentUserViewSet(viewsets.GenericViewSet[CyberValleyUser]):
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=["get"], name="Current user")
    def current(self, request: Request) -> Response:
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
