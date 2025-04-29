from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer[Notification]):
    class Meta:
        model = Notification
        fields = ("title", "body", "seen_at")
