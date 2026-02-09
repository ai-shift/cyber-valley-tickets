import logging

import telebot

from cyber_valley.common.telegram import require_telegram_bot_token
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
        The created Notification object, or None if creation failed
    """
    notification = None
    try:
        # Use create_and_notify to explicitly handle both creation and external
        # notification delivery, avoiding the need for Django signals
        notification = Notification.objects.create_and_notify(
            user=user,
            title=title,
            body=body,
        )
    except Exception:
        logger.exception("Failed to create notification for user %s", user.address)

    return notification


def send_notification_to_telegram(notification: Notification) -> None:
    telegram_social = UserSocials.objects.filter(
        user=notification.user, network=UserSocials.Network.TELEGRAM
    ).first()

    if not telegram_social:
        return

    token = require_telegram_bot_token()

    try:
        bot = telebot.TeleBot(token)
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
