from dataclasses import dataclass, field
from typing import Any

from rest_framework import serializers


@dataclass
class SIWEModel:
    address: str
    chain_id: str
    domain: str
    expiration_time: str
    invalid_before: str
    issued_at: str
    nonce: str
    resources: list[str]
    statement: str
    uri: str
    version: str
    signature: str


class SIWEModelSerializer(serializers.Serializer[SIWEModel]):
    address = serializers.CharField()
    chain_id = serializers.CharField()
    domain = serializers.CharField()
    expiration_time = serializers.CharField()
    invalid_before = serializers.CharField()
    issued_at = serializers.CharField()
    nonce = serializers.CharField()
    resources = serializers.ListField(child=serializers.CharField())
    statement = serializers.CharField()
    uri = serializers.CharField()
    version = serializers.CharField()
    signature = serializers.CharField(
        help_text="Message signed with user's private key"
    )

    def create(self, validated_data: dict[str, Any]) -> SIWEModel:
        return SIWEModel(**validated_data)


class SIWELoginSerializer(serializers.Serializer[dict[str, Any]]):
    address = serializers.CharField()
    chain_id = serializers.CharField()
    domain = serializers.CharField()
    expiration_time = serializers.CharField()
    invalid_before = serializers.CharField()
    issued_at = serializers.CharField()
    nonce = serializers.CharField()
    resources = serializers.ListField(child=serializers.CharField())
    statement = serializers.CharField()
    uri = serializers.CharField()
    version = serializers.CharField()
