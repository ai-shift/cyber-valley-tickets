from typing import Any

from rest_framework import serializers

from .models import (
    BusinessApplication,
    IndividualApplication,
)


# Response serializers for OpenAPI schema
class SendSMSResponseSerializer(serializers.Serializer[Any]):
    success = serializers.BooleanField()
    message = serializers.CharField()
    development_note = serializers.CharField(required=False)


class VerifyCodeResponseSerializer(serializers.Serializer[Any]):
    success = serializers.BooleanField()
    payload = serializers.DictField()
    message = serializers.CharField()


class SubmitApplicationResponseSerializer(serializers.Serializer[Any]):
    message = serializers.CharField()
    application_type = serializers.CharField()


MIN_PHONE_LENGTH = 8
MAX_FILE_SIZE = 5 * 1024 * 1024
ID_LENGTH = 16


class PhoneValidationError(Exception):
    pass


class SendSMSSerializer(serializers.Serializer[Any]):
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value: str) -> str:
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


class IndividualApplicationSerializer(
    serializers.ModelSerializer[IndividualApplication]
):
    class Meta:
        model = IndividualApplication
        fields = ("ktp",)

    def validate_ktp(self, value: str) -> str:
        if len(value) != ID_LENGTH:
            msg = "KTP must be exactly 16 characters"
            raise serializers.ValidationError(msg)
        return value


class BusinessApplicationSerializer(serializers.ModelSerializer[BusinessApplication]):
    class Meta:
        model = BusinessApplication
        fields = ("director_id", "akta", "sk_kemenkumham")

    def validate_director_id(self, value: str) -> str:
        if len(value) != ID_LENGTH:
            msg = "Director ID must be exactly 16 characters"
            raise serializers.ValidationError(msg)
        return value

    def validate_akta(self, value: Any) -> Any:
        if value.size > MAX_FILE_SIZE:
            msg = "Akta file size must not exceed 5 MB"
            raise serializers.ValidationError(msg)
        if not value.name.lower().endswith(".pdf"):
            msg = "Akta must be a PDF file"
            raise serializers.ValidationError(msg)
        return value

    def validate_sk_kemenkumham(self, value: Any) -> Any:
        if value.size > MAX_FILE_SIZE:
            msg = "SK Kemenkumham file size must not exceed 5 MB"
            raise serializers.ValidationError(msg)
        if not value.name.lower().endswith(".pdf"):
            msg = "SK Kemenkumham must be a PDF file"
            raise serializers.ValidationError(msg)
        return value
