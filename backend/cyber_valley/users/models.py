from typing import ClassVar

from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models


class CyberValleyUser(AbstractBaseUser):
    address = models.CharField(max_length=42, primary_key=True)
    # XXX: This field is requred because of bug in simplejwt
    is_active = models.BooleanField(default=True)

    REQUIRED_FIELDS: ClassVar[list[str]] = []
    USERNAME_FIELD = "address"
