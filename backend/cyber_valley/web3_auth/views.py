import secrets
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.middleware import csrf
from drf_spectacular.utils import (
    extend_schema,
)
from eth_account import Account
from eth_account.messages import encode_defunct
from rest_framework import exceptions, serializers
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from web3 import Web3

User = get_user_model()


@dataclass
class Web3LoginModel:
    address: str
    signature: str
    message: str


class Web3LoginModelSerializer(serializers.Serializer[Web3LoginModel]):
    address = serializers.CharField(
        min_length=42, max_length=42, help_text="Address of the user's EOA"
    )
    signature = serializers.CharField(
        help_text="Message signed with user's private key"
    )
    message = serializers.CharField(help_text="Nonce value retrieved from the server")

    def create(self, validated_data: dict[str, Any]) -> Web3LoginModel:
        return Web3LoginModel(**validated_data)


@extend_schema(
    request=Web3LoginModelSerializer,
    responses={(200, "text/html"): str, (204, "applicaiton/json"): None},
)
@api_view(["POST", "GET"])
@renderer_classes([JSONRenderer, TemplateHTMLRenderer])
def login(request: Request) -> Response:
    if request.method == "GET":
        return Response(template_name="login_ethereum.html")

    data = Web3LoginModelSerializer(data=request.data)
    data.is_valid(raise_exception=True)
    data = data.save()

    if not verify_signature(data):
        raise exceptions.AuthenticationFailed

    try:
        user = User.objects.get(address=data.address)
    except User.DoesNotExist:
        user = User(address=data.address)
        user.save()

    token = RefreshToken.for_user(user)

    response = Response(
        status=204,
    )

    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
        value=str(token.access_token),
        expires=datetime.now(tz=UTC) + settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )
    csrf.get_token(request)

    return response


def verify_signature(data: Web3LoginModel) -> bool:
    message_hash = encode_defunct(text=data.message)
    try:
        recovered_address = Account.recover_message(
            message_hash, signature=data.signature
        )
        recovered_address = Web3.to_checksum_address(recovered_address)
        if data.address.lower() == recovered_address.lower():
            return True
    except Exception as e:
        print(f"Signature verification error: {e}")
    return False


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify(_request: Request) -> Response:
    return Response(status=200)


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {"nonce": {"type": "string"}},
        }
    }
)
@api_view(["GET"])
def nonce(_request: Request) -> Response:
    nonce = secrets.token_hex(16)
    cache.set(nonce, "nonce", timeout=10)
    return Response({"nonce": nonce})
