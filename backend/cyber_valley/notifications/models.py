from typing import Any

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class NotificationManager(models.Manager["Notification"]):
    """Custom manager for Notification that handles creation and external notifications."""

    def create_and_notify(
        self, user: "Notification.user", title: str, body: str
    ) -> "Notification":
        """
        Create a notification and send it via Telegram if the user has a linked account.

        This method consolidates notification creation and external delivery into
        a single explicit operation, avoiding the need for Django signals.

        Args:
            user: The user to notify
            title: Notification title
            body: Notification body text

        Returns:
            The created Notification object
        """
        from cyber_valley.notifications.helpers import send_notification_to_telegram

        notification = self.create(user=user, title=title, body=body)
        send_notification_to_telegram(notification)
        return notification


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    notification_id = models.PositiveIntegerField(null=False, editable=False)
    title = models.CharField(max_length=200, null=False)
    body = models.TextField()
    seen_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    objects = NotificationManager()

    class Meta:
        unique_together = ("user", "notification_id")

    def __str__(self) -> str:
        return self.title

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.notification_id:
            last_notification = (
                Notification.objects.filter(user=self.user)
                .order_by("-notification_id")
                .first()
            )
            if last_notification:
                self.notification_id = last_notification.notification_id + 1
            else:
                self.notification_id = 1
        super().save(*args, **kwargs)
