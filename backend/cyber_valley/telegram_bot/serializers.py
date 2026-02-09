from typing import Any

from rest_framework import serializers


class TelegramLinkTokenRequestSerializer(serializers.Serializer[Any]):
    """Serializer for requesting a Telegram link token.

    The user must be authenticated. The token will be used to link
    their Telegram account to their Ethereum address securely.
    """

    purpose = serializers.ChoiceField(
        choices=[("link", "Link Telegram"), ("verifyshaman", "Verify Shaman")],
        default="link",
        help_text="Purpose of the linking token",
    )


class TelegramLinkTokenResponseSerializer(serializers.Serializer[Any]):
    """Serializer for Telegram link token response."""

    hash = serializers.CharField(help_text="The token hash to use in Telegram link")
    expires_in = serializers.IntegerField(help_text="Token validity in seconds")
