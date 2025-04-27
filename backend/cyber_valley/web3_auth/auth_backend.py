from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import BaseBackend
from django.http import HttpRequest
from eth_account import Account
from eth_account.messages import encode_defunct
from pydantic import BaseModel, Field
from web3 import Web3

from .models import User as UserType

User = get_user_model()


class Web3LoginModel(BaseModel):
    address: str = Field(
        description="User's externally owned account address",
        min_length=200,
        max_length=200,
    )
    signature: str = Field(description="Message signed with user's private key")
    message: str = Field(description="Message that is signed")


class Web3AuthBackend(BaseBackend):
    def authenticate(
        self, request: None | HttpRequest, **_kwargs: Any
    ) -> None | UserType:
        if request is None:
            return None
        data = Web3LoginModel.model_validate(request.POST)
        if not verify_signature(data):
            return None
        try:
            user = User.objects.get(username=data.address)
        except User.DoesNotExist:
            user = User(username=data.address)
            user.save()
        return user

    def get_user(self, user_id: str) -> UserType | None:
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


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
