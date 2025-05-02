from datetime import UTC, datetime

from django.db.models.query import QuerySet
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet[Notification]):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self) -> QuerySet[Notification, Notification]:
        user = self.request.user
        assert user.is_authenticated  # XXX: Required for the MyPy check
        return Notification.objects.filter(user=user)

    @extend_schema(responses={201: OpenApiResponse()})
    @action(detail=True, methods=["POST"])
    def seen(self, _request: Request, _pk: None | str = None) -> Response:
        notification = self.get_object()
        notification.seen_at = datetime.now(tz=UTC)
        notification.save()
        return Response(status=201)
