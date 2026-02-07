from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from rest_framework import serializers

Purpose = Literal["ticket_qr", "staff_verify"]


class SiwePayloadRequestSerializer(serializers.Serializer[dict[str, Any]]):
    address = serializers.CharField()
    purpose = serializers.ChoiceField(choices=["ticket_qr", "staff_verify"])


@dataclass
class SiwePayload:
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


class SiwePayloadSerializer(serializers.Serializer[SiwePayload]):
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

    def create(self, validated_data: dict[str, Any]) -> SiwePayload:
        return SiwePayload(**validated_data)


class SiwePayloadResponseSerializer(serializers.Serializer[dict[str, Any]]):
    payload = SiwePayloadSerializer()
    message = serializers.CharField()


class SiweVerifyRequestSerializer(serializers.Serializer[dict[str, Any]]):
    payload = SiwePayloadSerializer()
    signature = serializers.CharField()


class SiweVerifyResponseSerializer(serializers.Serializer[dict[str, Any]]):
    proof_token = serializers.CharField()
    address = serializers.CharField()
    expires_at = serializers.IntegerField()
