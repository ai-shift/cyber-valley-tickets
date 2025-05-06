from dataclasses import dataclass
from typing import Any

from rest_framework import serializers


@dataclass
class SIWEModel:
    address: str
    signature: str
    message: str
    nonce: str


class SIWEModelSerializer(serializers.Serializer[SIWEModel]):
    address = serializers.CharField(
        min_length=42, max_length=42, help_text="Address of the user's EOA"
    )
    signature = serializers.CharField(
        help_text="Message signed with user's private key"
    )
    message = serializers.CharField(help_text="Original message")
    nonce = serializers.CharField(help_text="Nonce value retrieved from the server")

    def create(self, validated_data: dict[str, Any]) -> SIWEModel:
        return SIWEModel(**validated_data)
