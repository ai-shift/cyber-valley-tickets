import logging
import os
import re
from typing import Any, Protocol

import telebot
from django.core.management.base import BaseCommand

from cyber_valley.users.models import CyberValleyUser, UserSocials

log = logging.getLogger(__name__)

ETH_ADDRESS_PATTERN = re.compile(r"0x[a-fA-F0-9]{40}")


class StartCommandStrategy(Protocol):
    def matches(self, text: str) -> bool: ...
    def execute(self, bot: telebot.TeleBot, message: telebot.types.Message) -> None: ...


class Command(BaseCommand):
    help = "Start Telegram bot using telebot library."

    def handle(self, *_args: list[Any], **_options: dict[str, Any]) -> None:
        token = os.environ["TELEGRAM_BOT_TOKEN"]
        bot = telebot.TeleBot(token)

        strategies: tuple[StartCommandStrategy, ...] = (
            ShamanVerificationStrategy(),
            AddressLinkingStrategy(),
        )

        @bot.message_handler(commands=["start"])
        def send_welcome(message: telebot.types.Message) -> None:
            log.info("got new start message with text %s", message.text)

            text = message.text or ""
            matched_strategies = [s for s in strategies if s.matches(text)]

            if len(matched_strategies) == 0:
                bot.reply_to(message, "Welcome to Cyber Valley Tickets Bot!")
                return

            assert len(matched_strategies) == 1, (
                f"Expected exactly one matching strategy, "
                f"got {len(matched_strategies)}: {matched_strategies}"
            )

            matched_strategies[0].execute(bot, message)

        @bot.message_handler(func=lambda _: True)
        def echo_all(message: telebot.types.Message) -> None:
            bot.reply_to(message, f"You said: {message.text}")

        log.info("Starting Telegram bot...")
        bot.infinity_polling()


def link_user_telegram(
    address: str, telegram_username: str
) -> tuple[CyberValleyUser, bool]:
    user, created = CyberValleyUser.objects.get_or_create(
        address=address, defaults={"role": CyberValleyUser.CUSTOMER}
    )
    UserSocials.objects.update_or_create(
        user=user,
        network=UserSocials.Network.TELEGRAM,
        defaults={"value": telegram_username},
    )
    return user, created


def handle_no_username(
    bot: telebot.TeleBot, message: telebot.types.Message, *start_params: str
) -> None:
    bot_username = bot.get_me().username
    start_param = "_".join(start_params)
    link_url = f"https://t.me/{bot_username}?start={start_param}"
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("Complete linking", url=link_url))
    bot.reply_to(
        message,
        "Please set a Telegram username first to link your account.\n\n"
        "After setting your username, click the button below:",
        reply_markup=markup,
    )


class AddressLinkingStrategy:
    def matches(self, text: str) -> bool:
        parts = text.split()
        return len(parts) == 2 and bool(ETH_ADDRESS_PATTERN.fullmatch(parts[1]))

    def execute(self, bot: telebot.TeleBot, message: telebot.types.Message) -> None:
        text = message.text or ""
        address = text.split()[1].lower()

        if not message.from_user or not message.from_user.username:
            handle_no_username(bot, message, address)
            return

        telegram_username = message.from_user.username
        _user, created = link_user_telegram(address, telegram_username)
        action = "created and linked" if created else "linked"
        log.info("User %s with telegram @%s", action, telegram_username)

        bot.reply_to(
            message,
            f"Welcome to Cyber Valley Tickets Bot!\n\n"
            f"Your address {address[:6]}...{address[-4:]} has been {action} "
            f"to your Telegram account @{telegram_username}.",
        )


class ShamanVerificationStrategy:
    def matches(self, text: str) -> bool:
        parts = text.split()
        if len(parts) != 2:
            return False
        start_parts = parts[1].split("_")
        return (
            len(start_parts) == 2
            and bool(ETH_ADDRESS_PATTERN.fullmatch(start_parts[0]))
            and start_parts[1] == "verifyshaman"
        )

    def execute(self, bot: telebot.TeleBot, message: telebot.types.Message) -> None:
        assert message.text is not None
        address = message.text.split()[1].split("_")[0].lower()

        if not message.from_user or not message.from_user.username:
            handle_no_username(bot, message, address, "verifyshaman")
            return

        telegram_username = message.from_user.username
        _user, created = link_user_telegram(address, telegram_username)
        action = "created and linked" if created else "linked"
        log.info(
            "User %s with telegram @%s for shaman verification",
            action,
            telegram_username,
        )

        public_api_host = os.environ.get("PUBLIC_API_HOST", "http://localhost:8000")
        verify_url = f"{public_api_host}/verify"
        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(
            telebot.types.InlineKeyboardButton("Verify as Shaman", url=verify_url)
        )

        bot.reply_to(
            message,
            f"Your address {address[:6]}...{address[-4:]} has been {action} "
            f"to your Telegram account @{telegram_username}.\n\n"
            "Click the button below to verify your Shaman status:",
            reply_markup=markup,
        )
