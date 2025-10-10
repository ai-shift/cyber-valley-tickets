from enum import Enum
from typing import ClassVar

from django.db import models


class ApplicationType(str, Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"


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
        from datetime import timedelta

        from django.utils import timezone

        return timezone.now() - self.created_at > timedelta(minutes=10)


class IndividualApplication(models.Model):
    ktp = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"Individual application - KTP: {self.ktp}"


class BusinessApplication(models.Model):
    director_id = models.CharField(max_length=16)
    akta = models.FileField(upload_to="applications/akta/")
    sk_kemenkumham = models.FileField(upload_to="applications/sk/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"Business application - Director: {self.director_id}"
