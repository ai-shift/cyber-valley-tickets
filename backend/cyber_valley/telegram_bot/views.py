import os
from typing import Any

import telebot
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.telegram_bot.inbound import ETH_ADDRESS_PATTERN, handle_update

# Header sent by mimi when forwarding updates
MIMI_FORWARD_HEADER = "HTTP_X_MIMI_FORWARD_SECRET"


def _schema_payload() -> dict[str, Any]:
    return {
        "version": 1,
        "schema_ttl_seconds": 300,
        "forward_to": "/api/telegram/updates",
        "matches": [
            {
                "type": "message",
                "command": "start",
                "args_regex": f"^{ETH_ADDRESS_PATTERN.pattern}$",
            },
            {
                "type": "message",
                "command": "start",
                "args_regex": f"^{ETH_ADDRESS_PATTERN.pattern}_verifyshaman$",
            },
            {
                "type": "callback_query",
                "data_prefixes": ["approve:", "decline:", "confirm_", "cancel_"],
            },
        ],
    }


@extend_schema(
    responses={
        200: {
            "type": "object",
            "properties": {
                "version": {"type": "integer"},
                "schema_ttl_seconds": {"type": "integer"},
                "forward_to": {"type": "string"},
                "matches": {"type": "array"},
            },
        },
    },
)
@api_view(["GET"])
def telegram_schema(_request: Request) -> Response:
    return Response(_schema_payload())


@extend_schema(
    request={
        "type": "object",
        "description": "Telegram update payload",
        "additionalProperties": True,
    },
    responses={
        200: {"type": "object", "properties": {"status": {"type": "string"}}},
        400: {"type": "object", "properties": {"detail": {"type": "string"}}},
        500: {"type": "object", "properties": {"detail": {"type": "string"}}},
    },
)
@api_view(["POST"])
def telegram_updates(request: Request) -> Response:
    data: Any = request.data
    if not isinstance(data, dict):
        return Response({"detail": "Invalid update payload"}, status=400)

    # Updates are forwarded by mimi. It includes the bot token in a header.
    # We validate it matches our configured token to keep a single source of truth.
    configured_token = os.environ.get("TELEGRAM_BOT_API_TOKEN", "")
    if not configured_token:
        return Response({"detail": "TELEGRAM_BOT_API_TOKEN is not set"}, status=500)

    forwarded_token = request.META.get(MIMI_FORWARD_HEADER, "")
    if not forwarded_token:
        return Response({"detail": "Missing X-Mimi-Forward-Secret header"}, status=403)

    if forwarded_token != configured_token:
        return Response({"detail": "Invalid X-Mimi-Forward-Secret header"}, status=403)

    bot = telebot.TeleBot(configured_token)
    handle_update(bot, data)
    return Response({"status": "ok"})
