import os
from typing import Final

from django.contrib.auth import get_user_model
from eth_account import Account
from eth_account.messages import encode_defunct
from pydantic import BaseModel, Field, ValidationError
from rest_framework import authentication, exceptions
from rest_framework.request import Request
from rest_framework_simplejwt.tokens import SlidingToken
from web3 import Web3

from .models import User as UserType

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


class Web3AuthBackend(authentication.BaseAuthentication):
    www_authenticate_realm = "api"
    media_type = "application/json"

    def authenticate(self, request: Request) -> None | tuple[UserType, SlidingToken]:
        try:
            data = Web3LoginModel.model_validate(request.data)
        except ValidationError:
            return None

        if not (MOCK_WEB3_AUTH or verify_signature(data)):
            raise exceptions.AuthenticationFailed

        try:
            user = User.objects.get(address=data.address)
        except User.DoesNotExist:
            user = User(address=data.address)
            user.save()

        return user, SlidingToken.for_user(user)


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
