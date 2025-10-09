from typing import Any

from rest_framework import serializers

MIN_PHONE_LENGTH = 8


class PhoneValidationError(Exception):
    pass


class SendSMSSerializer(serializers.Serializer[Any]):
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value: str) -> str:
        """Basic phone number validation"""
        if not value.startswith("+"):
            msg = "Phone number must start with +"
            raise serializers.ValidationError(msg)
        if len(value) < MIN_PHONE_LENGTH:
            msg = "Phone number too short"
            raise serializers.ValidationError(msg)
        return value


class VerifyCodeSerializer(serializers.Serializer[Any]):
    phone_number = serializers.CharField(max_length=20)
    verification_code = serializers.CharField(max_length=10)
