import os
from typing import Any

import telebot
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.telegram_bot.inbound import ETH_ADDRESS_PATTERN, handle_update


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

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        return Response({"detail": "TELEGRAM_BOT_TOKEN is not set"}, status=500)
    bot = telebot.TeleBot(token)
    handle_update(bot, data)
    return Response({"status": "ok"})
