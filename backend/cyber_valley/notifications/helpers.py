import logging
import os

import telebot

from cyber_valley.notifications.models import Notification
from cyber_valley.users.models import CyberValleyUser, UserSocials

logger = logging.getLogger(__name__)


def send_notification(
    user: CyberValleyUser, title: str, body: str
) -> Notification | None:
    """
    Create a notification and send it via Telegram if the user has a linked account.

    Args:
        user: The user to notify
        title: Notification title
        body: Notification body text

    Returns:
        The created/retrieved Notification object, or None if creation failed
    """
    try:
        notification, created = Notification.objects.get_or_create(
            user=user,
            title=title,
            defaults={"body": body},
        )

        return notification
    except Exception:
        logger.exception("Failed to create notification for user %s", user.address)
        return None
    else:
        return notification


def send_notification_to_telegram(notification: Notification) -> None:
    telegram_social = UserSocials.objects.filter(
        user=notification.user, network=UserSocials.Network.TELEGRAM
    ).first()

    if not telegram_social:
        return

    try:
        bot = telebot.TeleBot(os.environ["TELEGRAM_BOT_TOKEN"])
        chat_id = telegram_social.value
        message = f"<b>{notification.title}</b>\n\n{notification.body}"

        bot.send_message(
            chat_id,
            message,
            parse_mode="HTML",
        )
        logger.info(
            "Sent Telegram notification to user %s (chat_id: %s)",
            notification.user.address,
            chat_id,
        )
    except Exception:
        logger.exception(
            "Failed to send Telegram notification to user %s",
            notification.user.address,
        )
