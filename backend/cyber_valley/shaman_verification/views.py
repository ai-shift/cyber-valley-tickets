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

from cyber_valley.users.models import CyberValleyUser, UserSocials

from .serializers import CompanyVerificationSerializer, IndividualVerificationSerializer

log = logging.getLogger(__name__)


def send_verification_to_local_providers(
    verification_type: str, metadata_cid: str, files: list[tuple[str, Path]]
) -> None:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    bot = telebot.TeleBot(token)

    local_providers = CyberValleyUser.objects.filter(
        role=CyberValleyUser.LOCAL_PROVIDER
    )

    ipfs_url = f"{settings.IPFS_PUBLIC_HOST}/ipfs/{metadata_cid}"

    for provider in local_providers:
        telegram_social = provider.socials.filter(
            network=UserSocials.Network.TELEGRAM
        ).first()

        if not telegram_social:
            log.info(
                "Local provider %s has no telegram linked, skipping", provider.address
            )
            continue

        caption = (
            f"🔔 New Shaman Verification Request\n\n"
            f"Type: {verification_type}\n"
            f"IPFS Metadata: {ipfs_url}"
        )

        chat = telegram_social.value

        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(
            telebot.types.InlineKeyboardButton(
                "✅ Approve", callback_data=f"approve:{metadata_cid}"
            ),
            telebot.types.InlineKeyboardButton(
                "❌ Decline", callback_data=f"decline:{metadata_cid}"
            ),
        )

        media_group = []
        for idx, (_field_name, file_path) in enumerate(files):
            file_obj = cast(telebot.types.InputFile, file_path.open("rb"))
            media = telebot.types.InputMediaDocument(
                file_obj, caption=caption if idx == 0 else None
            )
            media_group.append(media)

        bot.send_media_group(chat, media_group)  # type: ignore[arg-type]

        bot.send_message(
            chat, "Please review the verification request:", reply_markup=markup
        )

        log.info("Sent verification to local provider %s (@%s)", provider.address, chat)


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
