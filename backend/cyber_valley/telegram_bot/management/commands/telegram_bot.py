import logging
import os
import re
from typing import Any, Literal, Protocol

import telebot
from django.core.management.base import BaseCommand

from cyber_valley.shaman_verification.models import VerificationRequest
from cyber_valley.telegram_bot.verification_helpers import (
    create_verification_caption,
    notify_shaman_of_decision,
    send_all_pending_verifications_to_provider,
)
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

        @bot.callback_query_handler(
            func=lambda call: call.data.startswith(("approve:", "decline:"))
        )
        def handle_verification_action(call: telebot.types.CallbackQuery) -> None:
            assert call.data is not None
            assert call.message is not None

            parts = call.data.split(":")
            action = parts[0]  # approve or decline
            verification_id = int(parts[1])
            original_message_id = call.message.message_id

            bot.edit_message_reply_markup(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                reply_markup=None,
            )

            markup = telebot.types.InlineKeyboardMarkup()
            markup.add(
                telebot.types.InlineKeyboardButton(
                    "✔️ Confirm",
                    callback_data=f"confirm_{action}:{verification_id}:{original_message_id}",
                ),
                telebot.types.InlineKeyboardButton(
                    "↩️ Cancel",
                    callback_data=f"cancel_{action}:{verification_id}:{original_message_id}",
                ),
            )

            action_text = "approve" if action == "approve" else "decline"
            bot.send_message(
                call.message.chat.id,
                f"Are you sure you want to {action_text} this verification request?",
                reply_markup=markup,
            )

        @bot.callback_query_handler(func=lambda call: call.data.startswith("confirm_"))
        def handle_confirmation(call: telebot.types.CallbackQuery) -> None:
            assert call.data is not None
            assert call.message is not None

            parts = call.data.replace("confirm_", "").split(":")
            action = parts[0]  # approve or decline
            verification_id = int(parts[1])
            original_message_id = int(parts[2])

            # Update verification status in database
            verification_request = VerificationRequest.objects.get(id=verification_id)
            assert verification_request.requester_id is not None

            old_status = verification_request.status
            new_status = (
                VerificationRequest.Status.APPROVED
                if action == "approve"
                else VerificationRequest.Status.DECLINED
            )
            is_update = old_status != VerificationRequest.Status.PENDING

            verification_request.status = new_status
            verification_request.save()

            notify_shaman_of_decision(verification_request, is_update=is_update)

            # Delete the confirmation message
            bot.delete_message(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
            )

            action_text = "approved" if action == "approve" else "declined"

            markup = telebot.types.InlineKeyboardMarkup()
            opposite_action = "decline" if action == "approve" else "approve"
            opposite_emoji = "❌" if action == "approve" else "✅"
            opposite_text = "Decline" if action == "approve" else "Approve"

            markup.add(
                telebot.types.InlineKeyboardButton(
                    f"{opposite_emoji} {opposite_text}",
                    callback_data=f"{opposite_action}:{verification_id}",
                )
            )

            # Update the original message with the result
            # Recreate caption with the new status
            status_literal: Literal["pending", "approved", "declined"] = (
                "approved" if action == "approve" else "declined"
            )

            # Get requester's Telegram info
            telegram_social = verification_request.requester.socials.filter(
                network=UserSocials.Network.TELEGRAM
            ).first()
            assert telegram_social is not None
            requester_chat_id = int(telegram_social.value)
            requester_username = (
                telegram_social.metadata.get("username")
                if telegram_social.metadata
                else None
            )

            new_caption = create_verification_caption(
                metadata_cid=verification_request.metadata_cid,
                verification_type=verification_request.verification_type,
                status=status_literal,
                requester_chat_id=requester_chat_id,
                requester_username=requester_username,
            )

            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=original_message_id,
                text=new_caption,
                reply_markup=markup,
                parse_mode="HTML",
            )

            log.info(
                "Verification %s (ID: %s) %s by user",
                verification_request.metadata_cid,
                verification_id,
                action_text,
            )

        @bot.callback_query_handler(func=lambda call: call.data.startswith("cancel_"))
        def handle_cancel(call: telebot.types.CallbackQuery) -> None:
            assert call.data is not None
            assert call.message is not None

            parts = call.data.replace("cancel_", "").split(":")
            _original_action = parts[0]
            verification_id = int(parts[1])
            original_message_id = int(parts[2])

            # Delete the confirmation message
            bot.delete_message(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
            )

            markup = telebot.types.InlineKeyboardMarkup()
            markup.add(
                telebot.types.InlineKeyboardButton(
                    "✅ Approve",
                    callback_data=f"approve:{verification_id}",
                ),
                telebot.types.InlineKeyboardButton(
                    "❌ Decline",
                    callback_data=f"decline:{verification_id}",
                ),
            )

            # Restore buttons on the original message
            bot.edit_message_reply_markup(
                chat_id=call.message.chat.id,
                message_id=original_message_id,
                reply_markup=markup,
            )

        @bot.message_handler(func=lambda _: True)
        def echo_all(message: telebot.types.Message) -> None:
            bot.reply_to(message, f"You said: {message.text}")

        log.info("Starting Telegram bot...")
        bot.infinity_polling()


def link_user_telegram(
    address: str, chat_id: int, telegram_username: str | None = None
) -> tuple[CyberValleyUser, bool]:
    user, created = CyberValleyUser.objects.get_or_create(
        address=address, defaults={"role": CyberValleyUser.CUSTOMER}
    )
    defaults: dict[str, Any] = {"value": str(chat_id)}
    if telegram_username:
        defaults["metadata"] = {"username": telegram_username}
    UserSocials.objects.update_or_create(
        user=user,
        network=UserSocials.Network.TELEGRAM,
        defaults=defaults,
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

        chat_id = message.from_user.id
        telegram_username = message.from_user.username
        user, created = link_user_telegram(address, chat_id, telegram_username)
        action = "created and linked" if created else "linked"
        log.info(
            "User %s with telegram @%s (chat_id: %s)",
            action,
            telegram_username,
            chat_id,
        )

        bot.reply_to(
            message,
            f"Welcome to Cyber Valley Tickets Bot!\n\n"
            f"Your address {address[:6]}...{address[-4:]} has been {action} "
            f"to your Telegram account @{telegram_username}.",
        )

        # If user is a local provider, send all pending verification requests
        if user.role == CyberValleyUser.LOCAL_PROVIDER:
            send_all_pending_verifications_to_provider(
                chat_id=chat_id, username=telegram_username
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

        chat_id = message.from_user.id
        telegram_username = message.from_user.username
        _user, created = link_user_telegram(address, chat_id, telegram_username)
        action = "created and linked" if created else "linked"
        log.info(
            "User %s with telegram @%s (chat_id: %s) for shaman verification",
            action,
            telegram_username,
            chat_id,
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
