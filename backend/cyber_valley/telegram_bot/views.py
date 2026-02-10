import logging
import os
import secrets
from typing import Any

import telebot
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework import exceptions
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.common.request_address import get_or_create_user_by_address
from cyber_valley.siwe.trust_cookie import require_trusted_address
from cyber_valley.telegram_bot.inbound import handle_update
from cyber_valley.telegram_bot.serializers import (
    TelegramLinkTokenRequestSerializer,
    TelegramLinkTokenResponseSerializer,
)

log = logging.getLogger(__name__)

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
@parser_classes([JSONParser])
@permission_classes([AllowAny])
def create_link_token(request: Request) -> Response:
    """Create a secure token for linking Telegram account.

    Generates a one-time use token that expires in 15 minutes.
    The token is used in the Telegram bot start command to verify
    that the user linking their Telegram account is the actual
    owner of the Ethereum address.
    """
    # Get address from header and verify it's in the trusted cookie
    # This ensures the user has properly authenticated with SIWE
    address = request.headers.get("X-User-Address", "").strip().lower()
    if not address:
        raise exceptions.NotAuthenticated("X-User-Address header is required")

    # Verify the address is in the trusted wallet cookie (signed by server)
    require_trusted_address(request, address=address, required_scopes=["ticket:nonce"])

    user = get_or_create_user_by_address(address)

    serializer = TelegramLinkTokenRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Generate a secure random token
    token_hash = secrets.token_urlsafe(32)

    # Store in cache with the user's address
    cache_key = f"{LINK_TOKEN_PREFIX}{token_hash}"
    cache.set(cache_key, user.address, timeout=LINK_TOKEN_TTL_SECONDS)

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
        log.warning("Invalid telegram update payload: %s", type(data))
        return Response({"detail": "Invalid update payload"}, status=400)

    # Updates are forwarded by mimi. It includes the bot token in a header.
    # We validate it matches our configured token to keep a single source of truth.
    configured_token = os.environ.get("TELEGRAM_BOT_API_TOKEN", "")
    if not configured_token:
        log.error("TELEGRAM_BOT_API_TOKEN is not set")
        return Response({"detail": "TELEGRAM_BOT_API_TOKEN is not set"}, status=500)

    forwarded_token = request.META.get(MIMI_FORWARD_HEADER, "")
    if not forwarded_token:
        log.warning("Missing X-Mimi-Forward-Secret header")
        return Response({"detail": "Missing X-Mimi-Forward-Secret header"}, status=403)

    if forwarded_token != configured_token:
        log.warning("Invalid X-Mimi-Forward-Secret header")
        return Response({"detail": "Invalid X-Mimi-Forward-Secret header"}, status=403)

    # Log the incoming update for debugging
    update_id = data.get("update_id", "unknown")
    message = data.get("message", {})
    callback = data.get("callback_query", {})
    if message:
        chat_id = message.get("chat", {}).get("id", "unknown")
        text = message.get("text", "")
        log.info("Processing update %s from chat %s: %s", update_id, chat_id, text[:50])
    elif callback:
        callback_id = callback.get("id", "unknown")
        log.info("Processing callback query %s: %s", update_id, callback_id)

    bot = telebot.TeleBot(configured_token)
    try:
        handle_update(bot, data)
    except Exception:
        log.exception("Failed to handle telegram update %s: %s", update_id, data)
        return Response({"detail": "Failed to process update"}, status=500)

    return Response({"status": "ok"})
