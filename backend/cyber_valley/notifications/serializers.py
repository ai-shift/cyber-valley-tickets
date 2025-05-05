from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer[Notification]):
    id = serializers.IntegerField(source="notification_id", read_only=True)

    class Meta:
        model = Notification
        fields = ("id", "title", "body", "seen_at", "created_at")
        read_only_fields = fields
