from rest_framework import serializers


class SendSMSSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value: str) -> str:
        """Basic phone number validation"""
        if not value.startswith("+"):
            raise serializers.ValidationError("Phone number must start with +")
        if len(value) < 8:
            raise serializers.ValidationError("Phone number too short")
        return value


class VerifyCodeSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    verification_code = serializers.CharField(max_length=10)
