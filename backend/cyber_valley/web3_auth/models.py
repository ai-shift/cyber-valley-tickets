from typing import ClassVar

from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models


class User(AbstractBaseUser):
    address = models.CharField(max_length=200, primary_key=True)

    REQUIRED_FIELDS: ClassVar[list[str]] = []
    USERNAME_FIELD = "address"
