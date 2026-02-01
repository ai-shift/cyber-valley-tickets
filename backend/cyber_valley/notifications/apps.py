from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cyber_valley.notifications"

    def ready(self) -> None:
        from . import signals  # noqa: F401
