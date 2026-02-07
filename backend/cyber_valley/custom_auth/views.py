import hashlib
import hmac
import logging
import secrets
import time
from typing import Any, assert_never

from django.conf import settings
from drf_spectacular.utils import PolymorphicProxySerializer, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.users.models import UserSocials

from .models import ApplicationType, SMSVerification
from .serializers import (
    BusinessApplicationSerializer,
    IndividualApplicationSerializer,
    SendSMSResponseSerializer,
    SendSMSSerializer,
    SubmitApplicationResponseSerializer,
    VerifyCodeResponseSerializer,
    VerifyCodeSerializer,
)

log = logging.getLogger(__name__)


@extend_schema(
    request=SendSMSSerializer,
    responses={
        200: SendSMSResponseSerializer,
        400: SendSMSResponseSerializer,
    },
)
@api_view(["POST"])
def send_sms(request: Request) -> Response:
    """Send SMS verification code (mocked)"""
    serializer = SendSMSSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    phone_number = serializer.validated_data["phone_number"]

    # For mocked SMS provider, always use hardcoded code 123456
    verification_code = "123456"

    # Store verification in database
    SMSVerification.objects.filter(phone_number=phone_number, verified=False).delete()
    SMSVerification.objects.create(
        phone_number=phone_number, verification_code=verification_code
    )

    # In production, this would send actual SMS
    # For development, we just log it
    print(f"📱 SMS sent to {phone_number}: {verification_code}")

    dev_note = f"Using mocked SMS. Code is always: {verification_code}"
    return Response(
        {
            "success": True,
            "message": f"Verification code sent to {phone_number}",
            "development_note": dev_note,
        }
    )


@extend_schema(
    request=VerifyCodeSerializer,
    responses={
        200: VerifyCodeResponseSerializer,
        400: VerifyCodeResponseSerializer,
        500: VerifyCodeResponseSerializer,
    },
)
@api_view(["POST"])
def verify_code(request: Request) -> Response:
    """Verify SMS code and return custom auth payload"""
    serializer = VerifyCodeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    phone_number = serializer.validated_data["phone_number"]
    verification_code = serializer.validated_data["verification_code"]

    # Find latest verification for this phone number
    try:
        sms_verification = SMSVerification.objects.filter(
            phone_number=phone_number, verified=False
        ).first()

        if not sms_verification:
            return Response(
                {"error": "No verification found for this phone number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if sms_verification.is_expired():
            return Response(
                {"error": "Verification code has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if sms_verification.verification_code != verification_code:
            return Response(
                {"error": "Invalid verification code"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark as verified
        sms_verification.verified = True
        sms_verification.save()

        # Generate custom auth payload for Thirdweb
        payload = generate_auth_payload(phone_number)

        return Response(
            {
                "success": True,
                "payload": payload,
                "message": "Phone number verified successfully",
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Verification failed: {e!s}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def generate_auth_payload(phone_number: str) -> dict[str, Any]:
    """Generate custom authentication payload for Thirdweb"""
    # Generate a unique identifier for this user based on phone number
    user_id = hashlib.sha256(phone_number.encode()).hexdigest()[:16]

    # Create a message that includes phone number and timestamp
    timestamp = int(time.time())
    message = f"Authenticating phone {phone_number} at {timestamp}"

    # Generate a signature using HMAC with Django secret key
    secret_key = settings.SECRET_KEY.encode()
    signature = hmac.new(secret_key, message.encode(), hashlib.sha256).hexdigest()

    # Generate encryption key for wallet
    encryption_key = secrets.token_hex(32)

    return {
        "message": message,
        "signature": f"0x{signature}",
        "encryptionKey": encryption_key,
        "userId": user_id,
        "phoneNumber": phone_number,
        "timestamp": timestamp,
    }


@extend_schema(
    request=PolymorphicProxySerializer(
        component_name="ApplicationRequest",
        serializers=[
            IndividualApplicationSerializer,
            BusinessApplicationSerializer,
        ],
        resource_type_field_name=None,
    ),
    responses={
        201: SubmitApplicationResponseSerializer,
        400: SubmitApplicationResponseSerializer,
    },
)
@api_view(["POST"])
@parser_classes([MultiPartParser])
@permission_classes([AllowAny])
def submit_application(request: Request) -> Response:
    from cyber_valley.common.request_address import get_or_create_user_by_address, require_address

    user = get_or_create_user_by_address(require_address(request))

    if not UserSocials.objects.filter(
        user=user, network=UserSocials.Network.TELEGRAM
    ).exists():
        return Response(
            {"error": "Telegram social is required to submit an application"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    application_type_str = request.data.get("application_type")

    if not application_type_str:
        return Response(
            {"error": "application_type is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        application_type = ApplicationType(application_type_str)
    except ValueError:
        valid_types = [t.value for t in ApplicationType]
        return Response(
            {"error": f"Invalid application_type. Must be one of: {valid_types}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    match application_type:
        case ApplicationType.INDIVIDUAL:
            individual_serializer = IndividualApplicationSerializer(data=request.data)
            if not individual_serializer.is_valid():
                return Response(
                    individual_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
        case ApplicationType.BUSINESS:
            business_serializer = BusinessApplicationSerializer(data=request.data)
            if not business_serializer.is_valid():
                return Response(
                    business_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
        case _:
            assert_never(application_type)

    return Response(
        {
            "message": "Application received successfully",
            "application_type": application_type.value,
        },
        status=status.HTTP_201_CREATED,
    )
