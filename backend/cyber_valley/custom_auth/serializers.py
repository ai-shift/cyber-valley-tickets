from typing import Any, ClassVar

from rest_framework import serializers

from .models import Application

MIN_PHONE_LENGTH = 8
MAX_FILE_SIZE = 5 * 1024 * 1024
ID_LENGTH = 16


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


class ApplicationSerializer(serializers.ModelSerializer[Application]):
    class Meta:  # type: ignore[misc,unused-ignore]
        model = Application
        fields: ClassVar[list[str]] = [
            "application_type",
            "ktp",
            "director_id",
            "akta",
            "sk_kemenkumham",
        ]

    def validate_ktp(self, value: str) -> str:
        if value and len(value) != ID_LENGTH:
            msg = "KTP must be exactly 16 characters"
            raise serializers.ValidationError(msg)
        return value

    def validate_director_id(self, value: str) -> str:
        if value and len(value) != ID_LENGTH:
            msg = "Director ID must be exactly 16 characters"
            raise serializers.ValidationError(msg)
        return value

    def validate_akta(self, value: Any) -> Any:
        if value:
            if value.size > MAX_FILE_SIZE:
                msg = "Akta file size must not exceed 5 MB"
                raise serializers.ValidationError(msg)
            if not value.name.lower().endswith(".pdf"):
                msg = "Akta must be a PDF file"
                raise serializers.ValidationError(msg)
        return value

    def validate_sk_kemenkumham(self, value: Any) -> Any:
        if value:
            if value.size > MAX_FILE_SIZE:
                msg = "SK Kemenkumham file size must not exceed 5 MB"
                raise serializers.ValidationError(msg)
            if not value.name.lower().endswith(".pdf"):
                msg = "SK Kemenkumham must be a PDF file"
                raise serializers.ValidationError(msg)
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        application_type = attrs.get("application_type")

        if application_type == Application.INDIVIDUAL:
            if not attrs.get("ktp"):
                msg = "KTP is required for individual applications"
                raise serializers.ValidationError(msg)
            if (
                attrs.get("director_id")
                or attrs.get("akta")
                or attrs.get("sk_kemenkumham")
            ):
                msg = (
                    "Business fields should not be provided for individual applications"
                )
                raise serializers.ValidationError(msg)

        elif application_type == Application.BUSINESS:
            if not attrs.get("director_id"):
                msg = "Director ID is required for business applications"
                raise serializers.ValidationError(msg)
            if not attrs.get("akta"):
                msg = "Akta is required for business applications"
                raise serializers.ValidationError(msg)
            if not attrs.get("sk_kemenkumham"):
                msg = "SK Kemenkumham is required for business applications"
                raise serializers.ValidationError(msg)
            if attrs.get("ktp"):
                msg = "KTP should not be provided for business applications"
                raise serializers.ValidationError(msg)

        return attrs
