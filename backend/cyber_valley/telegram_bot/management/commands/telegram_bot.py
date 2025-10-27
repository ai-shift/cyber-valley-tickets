import logging
import os
from typing import Any

import telebot
from django.core.management.base import BaseCommand

log = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Start Telegram bot using telebot library."

    def handle(self, *_args: list[Any], **_options: dict[str, Any]) -> None:
        token = os.environ["TELEGRAM_BOT_TOKEN"]
        bot = telebot.TeleBot(token)

        @bot.message_handler(commands=["start"])
        def send_welcome(message: telebot.types.Message) -> None:
            log.info("got new start message with text %s", message.text)
            bot.reply_to(
                message,
                "Welcome to Cyber Valley Tickets Bot!\n"
            )

        @bot.message_handler(func=lambda _: True)
        def echo_all(message: telebot.types.Message) -> None:
            bot.reply_to(message, f"You said: {message.text}")

        log.info("Starting Telegram bot...")
        bot.infinity_polling()
