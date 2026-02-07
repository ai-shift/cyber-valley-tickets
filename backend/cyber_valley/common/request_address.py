from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request

User = get_user_model()


def extract_address(request: Request) -> str | None:
    """
    Extract a wallet address from the request without relying on auth/session.

    Supported sources (first match wins):
    - Header: X-User-Address
    - Query:  address
    - Body:   address (works for JSON/form/multipart via DRF request.data)
    """
    header = request.headers.get("X-User-Address")
    if header:
        return header.strip().lower()

    query = request.query_params.get("address")
    if query:
        return query.strip().lower()

    try:
        body_val = request.data.get("address")  # type: ignore[union-attr]
    except Exception:
        body_val = None
    if isinstance(body_val, str) and body_val.strip():
        return body_val.strip().lower()

    return None


def require_address(request: Request) -> str:
    address = extract_address(request)
    if not address:
        raise ValidationError({"address": "Wallet address is required"})
    return address


def get_or_create_user_by_address(address: str):
    address_l = address.strip().lower()
    if not address_l:
        raise ValidationError({"address": "Wallet address is required"})
    user, _created = User.objects.get_or_create(address=address_l)
    return user

