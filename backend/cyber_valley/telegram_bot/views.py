import os
import secrets
from typing import Any

import telebot
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.telegram_bot.inbound import handle_update
from cyber_valley.telegram_bot.serializers import (
    TelegramLinkTokenRequestSerializer,
    TelegramLinkTokenResponseSerializer,
)

# Header sent by mimi when forwarding updates
MIMI_FORWARD_HEADER = "HTTP_X_MIMI_FORWARD_SECRET"

# Token pattern for secure linking (base64url-like)
TOKEN_PATTERN = r"[A-Za-z0-9_-]{32,64}"  # noqa: S105

# Cache key prefix and TTL
LINK_TOKEN_PREFIX = "tg:link:"  # noqa: S105
LINK_TOKEN_TTL_SECONDS = 900  # 15 minutes


def _schema_payload() -> dict[str, Any]:
    return {
        "version": 1,
        "schema_ttl_seconds": 300,
        "forward_to": "/api/telegram/updates",
        "matches": [
            {
                "type": "message",
                "command": "start",
                "args_regex": f"^{TOKEN_PATTERN}$",
            },
            {
                "type": "message",
                "command": "start",
                "args_regex": f"^{TOKEN_PATTERN}_verifyshaman$",
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
    request=TelegramLinkTokenRequestSerializer,
    responses={
        200: TelegramLinkTokenResponseSerializer,
        401: {"type": "object", "properties": {"detail": {"type": "string"}}},
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_link_token(request: Request) -> Response:
    """Create a secure token for linking Telegram account.

    Generates a one-time use token that expires in 15 minutes.
    The token is used in the Telegram bot start command to verify
    that the user linking their Telegram account is the actual
    owner of the Ethereum address.
    """
    serializer = TelegramLinkTokenRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Generate a secure random token
    token_hash = secrets.token_urlsafe(32)

    # Store in cache with the user's address
    # Note: IsAuthenticated permission ensures user is not AnonymousUser
    cache_key = f"{LINK_TOKEN_PREFIX}{token_hash}"
    cache.set(cache_key, request.user.address, timeout=LINK_TOKEN_TTL_SECONDS)  # type: ignore[union-attr]

    return Response(
        {
            "hash": token_hash,
            "expires_in": LINK_TOKEN_TTL_SECONDS,
        }
    )


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
