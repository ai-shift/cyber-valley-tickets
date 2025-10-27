import logging
import os
import time
from pathlib import Path
from typing import cast

import ipfshttpclient
import telebot
from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.telegram_bot.verification_helpers import create_verification_caption
from cyber_valley.users.models import CyberValleyUser, UserSocials

from .models import VerificationRequest
from .serializers import CompanyVerificationSerializer, IndividualVerificationSerializer

log = logging.getLogger(__name__)


def send_verification_to_local_providers(
    verification_type: str, metadata_cid: str, files: list[tuple[str, Path]]
) -> None:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    bot = telebot.TeleBot(token)

    # Create or get verification request in database
    verification_request, _created = VerificationRequest.objects.get_or_create(
        metadata_cid=metadata_cid,
        defaults={"verification_type": verification_type},
    )

    local_providers = CyberValleyUser.objects.filter(
        role=CyberValleyUser.LOCAL_PROVIDER
    )

    caption = create_verification_caption(
        metadata_cid=metadata_cid,
        verification_type=verification_type,
        status="pending",
    )

    for provider in local_providers:
        telegram_social = provider.socials.filter(
            network=UserSocials.Network.TELEGRAM
        ).first()

        if not telegram_social:
            log.info(
                "Local provider %s has no telegram linked, skipping", provider.address
            )
            continue

        chat_id = telegram_social.value
        username = (
            telegram_social.metadata.get("username")
            if telegram_social.metadata
            else None
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

        media_group = []
        for idx, (_field_name, file_path) in enumerate(files):
            file_obj = cast(telebot.types.InputFile, file_path.open("rb"))
            media = telebot.types.InputMediaDocument(
                file_obj, caption=caption if idx == 0 else None
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
            "Sent verification to local provider %s (%s)",
            provider.address,
            username_display,
        )


@api_view(["POST"])
@parser_classes([MultiPartParser])
def verify_individual(request: Request) -> Response:
    serializer = IndividualVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    target_path = settings.IPFS_DATA_PATH / "verifications" / str(int(time.time()))
    target_path.mkdir(exist_ok=True, parents=True)

    ktp_file = serializer.validated_data["ktp"]
    ktp_filename = f"ktp_{ktp_file.name}"
    ktp_path = target_path / ktp_filename
    ktp_path.write_bytes(ktp_file.read())

    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        ktp_cid = client.add(ktp_path)["Hash"]

        metadata = {"type": "individual", "ktp": ktp_cid}
        metadata_cid = client.add_json(metadata)

    send_verification_to_local_providers(
        verification_type="Individual",
        metadata_cid=metadata_cid,
        files=[("ktp", ktp_path)],
    )

    return Response({"cid": metadata_cid, "ktp": ktp_cid})


@api_view(["POST"])
@parser_classes([MultiPartParser])
def verify_company(request: Request) -> Response:
    serializer = CompanyVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    target_path = settings.IPFS_DATA_PATH / "verifications" / str(int(time.time()))
    target_path.mkdir(exist_ok=True, parents=True)

    ktp_file = serializer.validated_data["ktp"]
    ktp_filename = f"ktp_{ktp_file.name}"
    ktp_path = target_path / ktp_filename
    ktp_path.write_bytes(ktp_file.read())

    akta_file = serializer.validated_data["akta"]
    akta_filename = f"akta_{akta_file.name}"
    akta_path = target_path / akta_filename
    akta_path.write_bytes(akta_file.read())

    sk_file = serializer.validated_data["sk"]
    sk_filename = f"sk_{sk_file.name}"
    sk_path = target_path / sk_filename
    sk_path.write_bytes(sk_file.read())

    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        ktp_cid = client.add(ktp_path)["Hash"]
        akta_cid = client.add(akta_path)["Hash"]
        sk_cid = client.add(sk_path)["Hash"]

        metadata = {"type": "company", "ktp": ktp_cid, "akta": akta_cid, "sk": sk_cid}
        metadata_cid = client.add_json(metadata)

    send_verification_to_local_providers(
        verification_type="Company",
        metadata_cid=metadata_cid,
        files=[("ktp", ktp_path), ("akta", akta_path), ("sk", sk_path)],
    )

    return Response(
        {"cid": metadata_cid, "ktp": ktp_cid, "akta": akta_cid, "sk": sk_cid}
    )
