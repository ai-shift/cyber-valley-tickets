from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    notification_id = models.PositiveIntegerField(null=False, editable=False)
    title = models.CharField(max_length=200, null=False)
    body = models.TextField()
    seen_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    class Meta:
        unique_together = ('user', 'notification_id')

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.notification_id:
            last_notification = Notification.objects.filter(user=self.user).order_by('-notification_id').first()
            if last_notification:
                self.notification_id = last_notification.notification_id + 1
            else:
                self.notification_id = 1
        super().save(*args, **kwargs)
