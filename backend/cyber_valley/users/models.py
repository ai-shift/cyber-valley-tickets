from typing import TYPE_CHECKING, Any, ClassVar

from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models

if TYPE_CHECKING:
    CharFieldType = models.CharField[str, str]
else:
    CharFieldType = models.CharField


class AddressField(CharFieldType):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs["max_length"] = 42
        super().__init__(*args, **kwargs)

    def get_prep_value(self, value: str) -> None | str:
        value = super().get_prep_value(value)
        return value if value is None else value.lower()


class CyberValleyUser(AbstractBaseUser):
    CUSTOMER = "customer"
    STAFF = "staff"
    CREATOR = "creator"
    LOCAL_PROVIDER = "localprovider"
    VERIFIED_SHAMAN = "verifiedshaman"
    MASTER = "master"

    ROLE_CHOICES = (
        (CUSTOMER, "Customer"),
        (STAFF, "Staff"),
        (CREATOR, "Creator"),
        (LOCAL_PROVIDER, "Local Provider"),
        (VERIFIED_SHAMAN, "Verified Shaman"),
        (MASTER, "Master"),
    )

    address = AddressField(primary_key=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CUSTOMER)
    # XXX: This field is requred because of bug in simplejwt
    is_active = models.BooleanField(default=True)

    REQUIRED_FIELDS: ClassVar[list[str]] = []
    USERNAME_FIELD = "address"

    @property
    def is_staff(self) -> bool:
        return self.role in (self.STAFF, self.LOCAL_PROVIDER, self.MASTER)

    @property
    def is_creator(self) -> bool:
        return self.role in (
            self.CREATOR,
            self.VERIFIED_SHAMAN,
            self.LOCAL_PROVIDER,
            self.MASTER,
        )

    @property
    def is_local_provider(self) -> bool:
        return self.role == self.LOCAL_PROVIDER

    @property
    def is_verified_shaman(self) -> bool:
        return self.role == self.VERIFIED_SHAMAN

    @property
    def is_master(self) -> bool:
        return self.role == self.MASTER


class UserSocials(models.Model):
    class Network(models.TextChoices):
        TELEGRAM = "telegram"
        INSTAGRAM = "instagram"
        DISCORD = "discord"
        WHATSAPP = "whatsapp"

    user = models.ForeignKey(
        CyberValleyUser, on_delete=models.CASCADE, related_name="socials"
    )
    network = models.CharField(choices=Network)
    value = models.CharField()
    metadata = models.JSONField(null=True, blank=True, default=dict)

    class Meta:
        unique_together = ("user", "network", "value")

    def __str__(self) -> str:
        return f"{self.user.address} - {self.network} - {self.value}"
