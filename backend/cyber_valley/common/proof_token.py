from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from rest_framework import exceptions
from rest_framework.request import Request


@dataclass(frozen=True)
class ProofClaims:
    address: str
    scopes: list[str]
    issued_at: datetime
    expires_at: datetime


_SIGNER = TimestampSigner(salt="cyber_valley.siwe_proof")


def issue_proof_token(*, address: str, scopes: list[str]) -> str:
    # Keep payload small and stable. Expiry is enforced by TimestampSigner max_age.
    payload = {"address": address.lower(), "scopes": scopes}
    return _SIGNER.sign_object(payload)


def require_proof_claims(
    request: Request,
    *,
    required_scopes: list[str],
    max_age_seconds: int,
) -> ProofClaims:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise exceptions.NotAuthenticated("Missing Bearer proof token")
    token = auth.removeprefix("Bearer ").strip()
    if not token:
        raise exceptions.NotAuthenticated("Missing Bearer proof token")

    try:
        data = _SIGNER.unsign_object(token, max_age=max_age_seconds)
    except SignatureExpired as e:
        raise exceptions.NotAuthenticated("Proof token expired") from e
    except BadSignature as e:
        raise exceptions.NotAuthenticated("Invalid proof token") from e

    if not isinstance(data, dict):
        raise exceptions.NotAuthenticated("Invalid proof token payload")
    address = str(data.get("address", "")).lower()
    scopes = data.get("scopes")
    if (
        not address
        or not isinstance(scopes, list)
        or not all(isinstance(s, str) for s in scopes)
    ):
        raise exceptions.NotAuthenticated("Invalid proof token payload")

    missing = [s for s in required_scopes if s not in scopes]
    if missing:
        raise exceptions.PermissionDenied(f"Missing required scope(s): {missing}")

    # TimestampSigner doesn't expose issued_at/expires_at directly; use a best-effort
    # approximation for downstream logging/debugging.
    now = datetime.now(tz=UTC)
    return ProofClaims(
        address=address,
        scopes=scopes,
        issued_at=now,
        expires_at=now,
    )
