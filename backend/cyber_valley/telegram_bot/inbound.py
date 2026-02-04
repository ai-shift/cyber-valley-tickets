import logging
import os
import re
from typing import Any, Literal, Protocol

import telebot
from web3 import Web3

from cyber_valley.shaman_verification.contract_service import ContractService
from cyber_valley.shaman_verification.models import VerificationRequest
from cyber_valley.telegram_bot.verification_helpers import (
    create_verification_caption,
    notify_shaman_of_decision,
    send_all_pending_verifications_to_provider,
)
from cyber_valley.users.models import CyberValleyUser, UserSocials

log = logging.getLogger(__name__)

ETH_ADDRESS_PATTERN = re.compile(r"0x[a-fA-F0-9]{40}")

PUBLIC_API_HOST = os.environ.get("PUBLIC_API_HOST", "")


class InboundHandler(Protocol):
    def matches(self, update: dict[str, Any]) -> bool: ...
    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None: ...


def _get_message(update: dict[str, Any]) -> dict[str, Any] | None:
    message = update.get("message")
    return message if isinstance(message, dict) else None


def _get_callback(update: dict[str, Any]) -> dict[str, Any] | None:
    callback = update.get("callback_query")
    return callback if isinstance(callback, dict) else None


def _get_text(message: dict[str, Any]) -> str:
    text = message.get("text")
    return text if isinstance(text, str) else ""


def _get_from_user(message: dict[str, Any]) -> dict[str, Any] | None:
    from_user = message.get("from")
    return from_user if isinstance(from_user, dict) else None


def _get_chat_id(message: dict[str, Any]) -> int | None:
    chat = message.get("chat")
    if not isinstance(chat, dict):
        return None
    chat_id = chat.get("id")
    return chat_id if isinstance(chat_id, int) else None


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
    bot: telebot.TeleBot, message: dict[str, Any], *start_params: str
) -> None:
    bot_username = bot.get_me().username
    start_param = "_".join(start_params)
    link_url = f"https://t.me/{bot_username}?start={start_param}"
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("Complete linking", url=link_url))
    chat_id = _get_chat_id(message)
    if chat_id is None:
        return
    bot.send_message(
        chat_id,
        "Please set a Telegram username first to link your account.\n\n"
        "After setting your username, click the button below:",
        reply_markup=markup,
    )


def _parse_start_parts(text: str) -> list[str]:
    return text.split()


class StartLinkHandler:
    def matches(self, update: dict[str, Any]) -> bool:
        message = _get_message(update)
        if not message:
            return False
        text = _get_text(message)
        parts = _parse_start_parts(text)
        return (
            len(parts) == 2
            and parts[0] == "/start"
            and bool(ETH_ADDRESS_PATTERN.fullmatch(parts[1]))
        )

    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None:
        message = _get_message(update)
        if not message:
            return
        text = _get_text(message)
        parts = _parse_start_parts(text)
        if len(parts) != 2:
            return
        address = parts[1].lower()

        from_user = _get_from_user(message)
        if not from_user or not from_user.get("username"):
            handle_no_username(bot, message, address)
            return

        chat_id = from_user.get("id")
        if not isinstance(chat_id, int):
            return

        telegram_username = from_user.get("username")
        user, created = link_user_telegram(address, chat_id, telegram_username)
        action = "created and linked" if created else "linked"
        log.info(
            "User %s with telegram @%s (chat_id: %s)",
            action,
            telegram_username,
            chat_id,
        )

        bot.send_message(
            chat_id,
            (
                "Welcome to Cyber Valley Tickets Bot!\n\n"
                f"Your address {address[:6]}...{address[-4:]} has been {action} "
                f"to your Telegram account @{telegram_username}."
            ),
        )

        if user.has_role(CyberValleyUser.LOCAL_PROVIDER):
            send_all_pending_verifications_to_provider(
                chat_id=chat_id, username=telegram_username
            )


class StartVerifyShamanHandler:
    def matches(self, update: dict[str, Any]) -> bool:
        message = _get_message(update)
        if not message:
            return False
        text = _get_text(message)
        parts = _parse_start_parts(text)
        if len(parts) != 2 or parts[0] != "/start":
            return False
        start_parts = parts[1].split("_")
        return (
            len(start_parts) == 2
            and bool(ETH_ADDRESS_PATTERN.fullmatch(start_parts[0]))
            and start_parts[1] == "verifyshaman"
        )

    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None:
        message = _get_message(update)
        if not message:
            return
        text = _get_text(message)
        parts = _parse_start_parts(text)
        if len(parts) != 2:
            return
        address = parts[1].split("_")[0].lower()

        from_user = _get_from_user(message)
        if not from_user or not from_user.get("username"):
            handle_no_username(bot, message, address, "verifyshaman")
            return

        chat_id = from_user.get("id")
        if not isinstance(chat_id, int):
            return

        telegram_username = from_user.get("username")
        _user, created = link_user_telegram(address, chat_id, telegram_username)
        action = "created and linked" if created else "linked"
        log.info(
            "User %s with telegram @%s (chat_id: %s) for shaman verification",
            action,
            telegram_username,
            chat_id,
        )

        verify_url = f"{PUBLIC_API_HOST}/verify" if PUBLIC_API_HOST else "/verify"
        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(
            telebot.types.InlineKeyboardButton("Verify as Shaman", url=verify_url)
        )

        bot.send_message(
            chat_id,
            (
                f"Your address {address[:6]}...{address[-4:]} has been {action} "
                f"to your Telegram account @{telegram_username}.\n\n"
                "Click the button below to verify your Shaman status:"
            ),
            reply_markup=markup,
        )


class CallbackApproveDeclineHandler:
    def matches(self, update: dict[str, Any]) -> bool:
        callback = _get_callback(update)
        if not callback:
            return False
        data = callback.get("data")
        return isinstance(data, str) and data.startswith(("approve:", "decline:"))

    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None:
        callback = _get_callback(update)
        if not callback:
            return
        data = callback.get("data")
        if not isinstance(data, str):
            return
        message = callback.get("message")
        if not isinstance(message, dict):
            return

        parts = data.split(":")
        action = parts[0]
        verification_id = int(parts[1])
        original_message_id = message.get("message_id")
        chat = message.get("chat", {})
        chat_id = chat.get("id")
        if not isinstance(chat_id, int) or not isinstance(original_message_id, int):
            return

        bot.edit_message_reply_markup(
            chat_id=chat_id,
            message_id=original_message_id,
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
            chat_id,
            f"Are you sure you want to {action_text} this verification request?",
            reply_markup=markup,
        )


class CallbackConfirmHandler:
    def matches(self, update: dict[str, Any]) -> bool:
        callback = _get_callback(update)
        if not callback:
            return False
        data = callback.get("data")
        return isinstance(data, str) and data.startswith("confirm_")

    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None:
        callback = _get_callback(update)
        if not callback:
            return
        data = callback.get("data")
        if not isinstance(data, str):
            return
        message = callback.get("message")
        if not isinstance(message, dict):
            return

        parts = data.replace("confirm_", "").split(":")
        action = parts[0]
        verification_id = int(parts[1])
        original_message_id = int(parts[2])

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

        action_text = "approved" if action == "approve" else "declined"

        shaman_address = Web3.to_checksum_address(
            verification_request.requester.address
        )
        contract_service = ContractService()

        if action == "approve":
            success, error = contract_service.grant_verified_shaman_role(shaman_address)
        else:
            success, error = True, None

        chat = message.get("chat", {})
        chat_id = chat.get("id")
        if not isinstance(chat_id, int):
            return

        if not success:
            error_message = (
                "⚠️ <b>Blockchain Transaction Failed</b>\n\n"
                f"The verification was {action_text} in the database, "
                "but the smart contract transaction failed:\n\n"
                f"<code>{error}</code>\n\n"
                "Please contact the system administrator."
            )
            bot.send_message(
                chat_id=chat_id,
                text=error_message,
                parse_mode="HTML",
            )

        notify_shaman_of_decision(verification_request, is_update=is_update)

        confirmation_message_id = message.get("message_id")
        if isinstance(confirmation_message_id, int):
            bot.delete_message(
                chat_id=chat_id,
                message_id=confirmation_message_id,
            )

        status_literal: Literal["pending", "approved", "declined"] = (
            "approved" if action == "approve" else "declined"
        )

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
            chat_id=chat_id,
            message_id=original_message_id,
            text=new_caption,
            reply_markup=None,
            parse_mode="HTML",
        )

        log.info(
            "Verification %s (ID: %s) %s by user",
            verification_request.metadata_cid,
            verification_id,
            action_text,
        )


class CallbackCancelHandler:
    def matches(self, update: dict[str, Any]) -> bool:
        callback = _get_callback(update)
        if not callback:
            return False
        data = callback.get("data")
        return isinstance(data, str) and data.startswith("cancel_")

    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None:
        callback = _get_callback(update)
        if not callback:
            return
        data = callback.get("data")
        if not isinstance(data, str):
            return
        message = callback.get("message")
        if not isinstance(message, dict):
            return

        parts = data.replace("cancel_", "").split(":")
        verification_id = int(parts[1])
        original_message_id = int(parts[2])

        chat = message.get("chat", {})
        chat_id = chat.get("id")
        if not isinstance(chat_id, int):
            return

        confirmation_message_id = message.get("message_id")
        if isinstance(confirmation_message_id, int):
            bot.delete_message(
                chat_id=chat_id,
                message_id=confirmation_message_id,
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

        bot.edit_message_reply_markup(
            chat_id=chat_id,
            message_id=original_message_id,
            reply_markup=markup,
        )


class FallbackWelcomeHandler:
    def matches(self, update: dict[str, Any]) -> bool:
        message = _get_message(update)
        if not message:
            return False
        text = _get_text(message)
        return text.strip().startswith("/start")

    def handle(self, bot: telebot.TeleBot, update: dict[str, Any]) -> None:
        message = _get_message(update)
        if not message:
            return
        chat_id = _get_chat_id(message)
        if chat_id is None:
            return
        bot.send_message(chat_id, "Welcome to Cyber Valley Tickets Bot!")


HANDLERS: tuple[InboundHandler, ...] = (
    StartVerifyShamanHandler(),
    StartLinkHandler(),
    CallbackApproveDeclineHandler(),
    CallbackConfirmHandler(),
    CallbackCancelHandler(),
    FallbackWelcomeHandler(),
)


def handle_update(bot: telebot.TeleBot, update: dict[str, Any]) -> None:
    for handler in HANDLERS:
        if handler.matches(update):
            handler.handle(bot, update)
            return
