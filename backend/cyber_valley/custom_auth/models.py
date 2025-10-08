from django.db import models


class SMSVerification(models.Model):
    phone_number = models.CharField(max_length=20)
    verification_code = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"SMS verification for {self.phone_number}"

    def is_expired(self) -> bool:
        """Check if verification code is expired (10 minutes)"""
        from datetime import timedelta

        from django.utils import timezone

        return timezone.now() - self.created_at > timedelta(minutes=10)
