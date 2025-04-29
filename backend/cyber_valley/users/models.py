from typing import ClassVar

from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models


class CyberValleyUser(AbstractBaseUser):
    CUSTOMER = "customer"
    STAFF = "staff"
    CREATOR = "creator"
    MASTER = "master"

    ROLE_CHOICES = (
        (CUSTOMER, "Customer"),
        (STAFF, "Staff"),
        (CREATOR, "Creator"),
        (MASTER, "Master"),
    )

    address = models.CharField(max_length=42, primary_key=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CUSTOMER)
    # XXX: This field is requred because of bug in simplejwt
    is_active = models.BooleanField(default=True)

    REQUIRED_FIELDS: ClassVar[list[str]] = []
    USERNAME_FIELD = "address"

    @property
    def is_staff(self) -> bool:
        return self.role in (self.STAFF, self.MASTER)

    @property
    def is_creator(self) -> bool:
        return self.role in (self.CREATOR, self.MASTER)

    @property
    def is_master(self) -> bool:
        return self.role == self.MASTER
