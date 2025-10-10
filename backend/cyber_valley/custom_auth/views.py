import hashlib
import hmac
import logging
import secrets
import time
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import SMSVerification
from .serializers import ApplicationSerializer, SendSMSSerializer, VerifyCodeSerializer

log = logging.getLogger(__name__)


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


@api_view(["POST"])
@parser_classes([MultiPartParser])
def submit_application(request: Request) -> Response:
    serializer = ApplicationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    application_type = serializer.validated_data["application_type"]

    log.info("=" * 80)
    log.info("NEW APPLICATION RECEIVED")
    log.info("=" * 80)
    log.info("Application Type: %s", application_type)

    if application_type == "individual":
        log.info("KTP: %s", serializer.validated_data["ktp"])
    else:
        log.info("Director ID: %s", serializer.validated_data["director_id"])
        akta = serializer.validated_data.get("akta")
        sk = serializer.validated_data.get("sk_kemenkumham")
        if akta:
            log.info("Akta file: %s (size: %d bytes)", akta.name, akta.size)
        if sk:
            log.info("SK Kemenkumham file: %s (size: %d bytes)", sk.name, sk.size)

    log.info("=" * 80)

    return Response(
        {
            "success": True,
            "message": "Application received successfully",
            "application_type": application_type,
        },
        status=status.HTTP_201_CREATED,
    )
