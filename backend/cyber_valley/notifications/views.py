from datetime import UTC, datetime

from django.db.models import Q
from django.db.models.query import QuerySet
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search notifications by title or body",
                required=False,
            ),
        ],
    ),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=str,
                location=OpenApiParameter.PATH,
                description="Notification ID",
            ),
        ],
    ),
    seen=extend_schema(
        parameters=[
            OpenApiParameter(
                name="notification_id",
                type=str,
                location=OpenApiParameter.PATH,
                description="Notification ID",
            ),
        ],
    ),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet[Notification]):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = "notification_id"

    def retrieve(self, request: Request, pk: int | None = None) -> Response:
        user = request.user
        notification = get_object_or_404(Notification, notification_id=pk, user=user)
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    def get_queryset(self) -> QuerySet[Notification, Notification]:
        user = self.request.user
        assert user.is_authenticated  # XXX: Required for the MyPy check
        queryset = Notification.objects.filter(user=user).order_by("-created_at")
        search_query = self.request.query_params.get("search", "")
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | Q(body__icontains=search_query)
            )
        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="notification_id",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description="Notification ID",
            ),
        ],
        responses={204: OpenApiResponse()},
    )
    @action(detail=False, methods=["post"], url_path="seen/(?P<notification_id>[^/.]+)")
    def seen(self, request: Request, notification_id: str) -> Response:
        user = request.user
        notification = get_object_or_404(
            Notification, notification_id=notification_id, user=user
        )
        notification.seen_at = datetime.now(tz=UTC)
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
