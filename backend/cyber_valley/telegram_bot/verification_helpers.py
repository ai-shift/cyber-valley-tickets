import logging
import os
from pathlib import Path
from typing import Literal, assert_never, cast

import ipfshttpclient
import telebot
from django.conf import settings

from cyber_valley.shaman_verification.models import VerificationRequest

log = logging.getLogger(__name__)


def create_verification_caption(
    metadata_cid: str,
    verification_type: str,
    status: Literal["pending", "approved", "declined"] = "pending",
    requester_chat_id: int | None = None,
    requester_username: str | None = None,
) -> str:
    """Create caption for verification request message based on status."""
    ipfs_url = f"{settings.IPFS_PUBLIC_HOST}/ipfs/{metadata_cid}"

    header: str
    match status:
        case "pending":
            header = "🔔 New Shaman Verification Request"
        case "approved":
            header = "✅ Verification request has been approved"
        case "declined":
            header = "❌ Verification request has been declined"
        case _ as unreachable:
            assert_never(unreachable)

    # Format IPFS link as HTML
    ipfs_link = f'<a href="{ipfs_url}">View on IPFS</a>'

    # Build caption parts
    caption_parts = [header, f"\nType: {verification_type}"]

    # Add requester info if available
    if requester_chat_id:
        requester_display = requester_username or "User"
        requester_link = (
            f'<a href="tg://user?id={requester_chat_id}">@{requester_display}</a>'
        )
        caption_parts.append(f"Requester: {requester_link}")

    caption_parts.append(f"IPFS Metadata: {ipfs_link}")

    return "\n".join(caption_parts)


def send_verification_request_to_provider(
    chat_id: int, verification_request_id: int, username: str | None = None
) -> None:
    """Send a single verification request to a local provider via Telegram."""
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    bot = telebot.TeleBot(token)

    try:
        verification_request = VerificationRequest.objects.get(
            id=verification_request_id
        )
    except VerificationRequest.DoesNotExist:
        log.exception(
            "Verification request %s not found, cannot send to provider",
            verification_request_id,
        )
        return

    caption = create_verification_caption(
        metadata_cid=verification_request.metadata_cid,
        verification_type=verification_request.verification_type,
        status="pending",
        requester_chat_id=verification_request.requester_telegram_chat_id,
        requester_username=verification_request.requester_telegram_username,
    )

    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(
        telebot.types.InlineKeyboardButton(
            "✅ Approve", callback_data=f"approve:{verification_request.id}"
        ),
        telebot.types.InlineKeyboardButton(
            "❌ Decline", callback_data=f"decline:{verification_request.id}"
        ),
    )

    # Get files from IPFS
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        metadata = client.get_json(verification_request.metadata_cid)

    files: list[tuple[str, Path]] = []
    ipfs_data_path = settings.IPFS_DATA_PATH / "verifications"

    if (
        verification_request.verification_type
        == VerificationRequest.VerificationType.INDIVIDUAL
    ):
        ktp_cid = metadata.get("ktp")
        if ktp_cid:
            # Find file by searching for pattern
            for ktp_path in ipfs_data_path.glob("*/ktp_*"):
                files.append(("ktp", ktp_path))
                break
    elif (
        verification_request.verification_type
        == VerificationRequest.VerificationType.COMPANY
    ):
        for field in ("ktp", "akta", "sk"):
            field_cid = metadata.get(field)
            if field_cid:
                for field_path in ipfs_data_path.glob(f"*/{field}_*"):
                    files.append((field, field_path))
                    break

    if not files:
        log.warning(
            "No files found for verification request %s, sending message without media",
            verification_request_id,
        )
        bot.send_message(chat_id, caption, reply_markup=markup, parse_mode="HTML")
        return

    # Send media group with caption
    media_group = []
    for idx, (_field_name, file_path) in enumerate(files):
        file_obj = cast(telebot.types.InputFile, file_path.open("rb"))
        media = telebot.types.InputMediaDocument(
            file_obj,
            caption=caption if idx == 0 else None,
            parse_mode="HTML" if idx == 0 else None,
        )
        media_group.append(media)

    messages = bot.send_media_group(chat_id, media_group)  # type: ignore[arg-type]

    if messages:
        bot.edit_message_reply_markup(
            chat_id=chat_id,
            message_id=messages[-1].message_id,
            reply_markup=markup,
        )

    username_display = f"@{username}" if username else chat_id
    log.info(
        "Sent verification request %s to provider %s",
        verification_request_id,
        username_display,
    )


def send_all_pending_verifications_to_provider(
    chat_id: int, username: str | None = None
) -> None:
    """Send all pending verification requests to a local provider."""
    pending_verifications = VerificationRequest.objects.filter(
        status=VerificationRequest.Status.PENDING
    )

    count = pending_verifications.count()
    if count == 0:
        log.info("No pending verifications to send to provider")
        return

    log.info("Sending %s pending verification requests to provider", count)

    for verification_request in pending_verifications:
        try:
            send_verification_request_to_provider(
                chat_id=chat_id,
                verification_request_id=verification_request.id,
                username=username,
            )
        except Exception:
            log.exception(
                "Failed to send verification request %s to provider",
                verification_request.id,
            )
