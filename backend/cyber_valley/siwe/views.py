from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from django.conf import settings
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework import exceptions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.common.proof_token import issue_proof_token
from cyber_valley.siwe.serializers import (
    SiwePayloadRequestSerializer,
    SiwePayloadResponseSerializer,
    SiweVerifyRequestSerializer,
    SiweVerifyResponseSerializer,
)
from cyber_valley.siwe.trust_cookie import (
    is_trusted,
    maybe_refresh_cookie,
    read_trust_cookie,
    set_trust_cookie,
    upsert_trusted_address,
)
from cyber_valley.web3_auth.serializers import SIWEModel
from cyber_valley.web3_auth.service import create_login_message, verify_signature

NONCE_TTL_SECONDS = 5 * 60
# Proof token TTL can be longer than the SIWE message TTL. It only grants the
# ability to request short-lived rotating nonces, which remain the primary anti-replay mechanism.
PROOF_TTL_SECONDS = 60 * 60


def _get_domain(request: Request) -> str:
    # SIWE domain should match the site the user is interacting with.
    host = request.get_host()
    # Strip port for nicer UX and more stable matching.
    return host.split(":")[0]


def _purpose_scopes(purpose: str) -> list[str]:
    if purpose == "ticket_qr":
        return ["ticket:nonce"]
    if purpose == "staff_verify":
        return ["ticket:verify"]
    raise ValueError(f"Unknown purpose: {purpose}")


def _purpose_statement(purpose: str) -> str:
    if purpose == "ticket_qr":
        return "Sign in to prove you own this wallet and show rotating ticket QR codes."
    if purpose == "staff_verify":
        return "Sign in to prove you control this wallet and verify tickets."
    raise ValueError(f"Unknown purpose: {purpose}")


@extend_schema(
    request=SiwePayloadRequestSerializer,
    responses={200: SiwePayloadResponseSerializer},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def siwe_payload(request: Request) -> Response:
    s = SiwePayloadRequestSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    address = cast(str, s.validated_data["address"]).lower()
    purpose = cast(str, s.validated_data["purpose"])

    now = datetime.now(tz=UTC)
    nonce_value = secrets.token_hex(16)
    payload: dict[str, Any] = {
        "address": address,
        "chain_id": str(getattr(settings, "DEFAULT_CHAIN_ID", "1337")),
        "domain": _get_domain(request),
        "expiration_time": str(int((now + timedelta(minutes=5)).timestamp())),
        "invalid_before": str(int(now.timestamp())),
        "issued_at": str(int(now.timestamp())),
        "nonce": nonce_value,
        "resources": _purpose_scopes(purpose),
        "statement": _purpose_statement(purpose),
        "uri": request.build_absolute_uri("/"),
        "version": "1",
    }

    # Cache the exact payload so the verifier can reject tampering.
    cache.set(f"siwe:{nonce_value}", payload, timeout=NONCE_TTL_SECONDS)
    message = create_login_message(SIWEModel(signature="", **payload))

    resp = SiwePayloadResponseSerializer(data={"payload": payload, "message": message})
    resp.is_valid(raise_exception=True)
    return Response(resp.validated_data, status=status.HTTP_200_OK)


@extend_schema(
    request=SiweVerifyRequestSerializer,
    responses={200: SiweVerifyResponseSerializer},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def siwe_verify(request: Request) -> Response:
    s = SiweVerifyRequestSerializer(data=request.data)
    s.is_valid(raise_exception=True)

    payload = cast(dict[str, Any], s.validated_data["payload"])
    signature = cast(str, s.validated_data["signature"])
    nonce = cast(str, payload["nonce"])

    cached = cache.get(f"siwe:{nonce}")
    # Always delete the nonce (one-time use).
    cache.delete(f"siwe:{nonce}")
    if not cached or cached != payload:
        return Response("Nonce expired or invalid", status=400)

    model = SIWEModel(signature=signature, **payload)
    if not verify_signature(model):
        raise exceptions.AuthenticationFailed("Invalid SIWE signature")

    purpose_scopes = cast(list[str], payload.get("resources", []))
    token = issue_proof_token(address=model.address, scopes=purpose_scopes)
    expires_at = int((datetime.now(tz=UTC) + timedelta(seconds=PROOF_TTL_SECONDS)).timestamp())

    # Persist device trust via HttpOnly cookie (supports one-click account switching).
    cookie = upsert_trusted_address(
        read_trust_cookie(request),
        address=model.address,
        scopes=purpose_scopes,
    )

    resp = SiweVerifyResponseSerializer(
        data={
            "proof_token": token,
            "address": model.address.lower(),
            "expires_at": cookie.expires_at,
        }
    )
    resp.is_valid(raise_exception=True)
    response = Response(resp.validated_data, status=200)
    set_trust_cookie(response, cookie)
    return response


@extend_schema(
    parameters=[],
    responses={
        200: {
            "type": "object",
            "properties": {
                "trusted": {"type": "boolean"},
                "expires_at": {"type": "integer"},
            },
        }
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def siwe_status(request: Request) -> Response:
    address = (request.query_params.get("address") or "").lower()
    scope = request.query_params.get("scope") or ""
    cookie = read_trust_cookie(request)

    trusted = bool(address and scope and is_trusted(cookie, address=address, required_scopes=[scope]))
    expires_at = cookie.expires_at if cookie else 0

    response = Response({"trusted": trusted, "expires_at": expires_at}, status=200)
    if cookie:
        maybe_refresh_cookie(response, cookie)
    return response
