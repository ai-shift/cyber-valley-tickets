from typing import ClassVar

from django.db import models


class SMSVerification(models.Model):
    phone_number = models.CharField(max_length=20)
    verification_code = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"SMS verification for {self.phone_number}"

    def is_expired(self) -> bool:
        """Check if verification code is expired (10 minutes)"""
        from datetime import timedelta

        from django.utils import timezone

        return timezone.now() - self.created_at > timedelta(minutes=10)


class Application(models.Model):
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    APPLICATION_TYPE_CHOICES: ClassVar[list[tuple[str, str]]] = [
        (INDIVIDUAL, "Individual"),
        (BUSINESS, "Business"),
    ]

    application_type = models.CharField(max_length=20, choices=APPLICATION_TYPE_CHOICES)
    ktp = models.CharField(max_length=16, blank=True)
    director_id = models.CharField(max_length=16, blank=True)
    akta = models.FileField(upload_to="applications/akta/", blank=True, null=True)
    sk_kemenkumham = models.FileField(
        upload_to="applications/sk/", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.application_type} application - {self.created_at}"
