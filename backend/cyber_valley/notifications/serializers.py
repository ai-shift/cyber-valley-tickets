from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer[Notification]):
    id = serializers.IntegerField(source="notification_id", read_only=True)
    created_at_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ("id", "title", "body", "seen_at", "created_at_timestamp")
        read_only_fields = fields

    def get_created_at_timestamp(self, obj: Notification) -> int:
        return int(obj.created_at.timestamp())
