from django.db.models.query import QuerySet
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet[Notification]):
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self) -> QuerySet[Notification, Notification]:
        user = self.request.user
        assert user.is_authenticated  # XXX: Required for the MyPy check
        return Notification.objects.filter(user=user)
