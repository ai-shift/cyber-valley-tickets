from django.db.models.signals import post_save
from django.dispatch import receiver

from cyber_valley.notifications.helpers import send_notification_to_telegram
from cyber_valley.notifications.models import Notification


@receiver(post_save, sender=Notification)
def mirror_notification_to_telegram(
    _sender: type[Notification],
    instance: Notification,
    created: bool,
    **_kwargs: object,
) -> None:
    if not created:
        return
    send_notification_to_telegram(instance)
