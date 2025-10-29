import uuid
from typing import ClassVar

from django.db import models


class VerificationRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"

    class VerificationType(models.TextChoices):
        INDIVIDUAL = "Individual", "Individual"
        COMPANY = "Company", "Company"

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    metadata_cid = models.CharField(max_length=255)
    verification_type = models.CharField(
        max_length=20, choices=VerificationType.choices
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    requester = models.ForeignKey(
        "users.CyberValleyUser",
        on_delete=models.CASCADE,
        related_name="verification_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "verification_requests"
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return (
            f"VerificationRequest #{self.id} - "
            f"{self.metadata_cid[:10]}... ({self.status})"
        )
