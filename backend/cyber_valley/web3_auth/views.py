import os
from datetime import UTC, datetime
from typing import Final

from django.conf import settings
from django.contrib.auth import get_user_model
from django.middleware import csrf
from eth_account import Account
from eth_account.messages import encode_defunct
from pydantic import BaseModel, Field, ValidationError
from rest_framework import exceptions
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from web3 import Web3

MOCK_WEB3_AUTH: Final = bool(os.getenv("MOCK_WEB3_AUTH"))
if MOCK_WEB3_AUTH:
    print("!!! USING MOCKED AUTH MODULE !!!")

User = get_user_model()


class Web3LoginModel(BaseModel):
    address: str = Field(
        description="User's externally owned account address",
        min_length=42,
        max_length=42,
    )
    signature: str = Field(description="Message signed with user's private key")
    message: str = Field(description="Message that is signed")


# FIXME: Add request / response OpenAPI schema
@api_view(["POST", "GET"])
def login(request: Request) -> Response:
    if request.method == "GET":
        return Response(template_name="login_ethereum.html")

    try:
        data = Web3LoginModel.model_validate(request.data)
    except ValidationError as e:
        raise exceptions.ParseError from e

    if not (MOCK_WEB3_AUTH or verify_signature(data)):
        raise exceptions.AuthenticationFailed

    try:
        user = User.objects.get(address=data.address)
    except User.DoesNotExist:
        user = User(address=data.address)
        user.save()

    token = RefreshToken.for_user(user)

    response = Response()

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
