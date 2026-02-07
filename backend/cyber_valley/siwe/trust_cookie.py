from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from django.conf import settings
from django.core.signing import BadSignature, Signer
from rest_framework import exceptions
from rest_framework.request import Request
from rest_framework.response import Response

COOKIE_NAME = "cv_trusted_wallets"
COOKIE_TTL_DAYS = 30
COOKIE_REFRESH_AFTER_DAYS = 1

_SIGNER = Signer(salt="cyber_valley.trusted_wallets")


@dataclass
class TrustedEntry:
    address: str
    scopes: list[str]


@dataclass
class TrustCookie:
    updated_at: int
    expires_at: int
    entries: list[TrustedEntry]


def _now_ts() -> int:
    return int(datetime.now(tz=UTC).timestamp())


def _decode(raw: str) -> TrustCookie | None:
    try:
        data = _SIGNER.unsign_object(raw)
    except BadSignature:
        return None

    if not isinstance(data, dict):
        return None
    updated_at = data.get("updated_at")
    expires_at = data.get("expires_at")
    entries_raw = data.get("entries")
    if not isinstance(updated_at, int) or not isinstance(expires_at, int):
        return None
    if not isinstance(entries_raw, list):
        return None

    entries: list[TrustedEntry] = []
    for e in entries_raw:
        if not isinstance(e, dict):
            continue
        address = e.get("address")
        scopes = e.get("scopes")
        if not isinstance(address, str) or not isinstance(scopes, list):
            continue
        if not all(isinstance(s, str) for s in scopes):
            continue
        entries.append(TrustedEntry(address=address.lower(), scopes=scopes))

    return TrustCookie(updated_at=updated_at, expires_at=expires_at, entries=entries)


def _encode(cookie: TrustCookie) -> str:
    payload = {
        "updated_at": cookie.updated_at,
        "expires_at": cookie.expires_at,
        "entries": [{"address": e.address, "scopes": e.scopes} for e in cookie.entries],
    }
    return _SIGNER.sign_object(payload)


def read_trust_cookie(request: Request) -> TrustCookie | None:
    raw = request.COOKIES.get(COOKIE_NAME)
    if not raw:
        return None
    cookie = _decode(raw)
    if not cookie:
        return None
    now = _now_ts()
    if now >= cookie.expires_at:
        return None
    return cookie


def upsert_trusted_address(
    cookie: TrustCookie | None, *, address: str, scopes: list[str]
) -> TrustCookie:
    addr = address.lower()
    now = _now_ts()
    expires_at = int(
        (
            datetime.fromtimestamp(now, tz=UTC) + timedelta(days=COOKIE_TTL_DAYS)
        ).timestamp()
    )
    entries: list[TrustedEntry] = []
    if cookie:
        entries = cookie.entries

    by_addr = {e.address: e for e in entries}
    existing = by_addr.get(addr)
    if existing:
        merged_scopes = sorted({*existing.scopes, *scopes})
        by_addr[addr] = TrustedEntry(address=addr, scopes=merged_scopes)
    else:
        by_addr[addr] = TrustedEntry(address=addr, scopes=sorted(set(scopes)))

    return TrustCookie(
        updated_at=now,
        expires_at=expires_at,
        entries=sorted(by_addr.values(), key=lambda e: e.address),
    )


def set_trust_cookie(response: Response, cookie: TrustCookie) -> None:
    secure = bool(getattr(settings, "SESSION_COOKIE_SECURE", False))
    response.set_cookie(
        key=COOKIE_NAME,
        value=_encode(cookie),
        max_age=COOKIE_TTL_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=secure,
        samesite="Lax",
    )


def maybe_refresh_cookie(response: Response, cookie: TrustCookie) -> None:
    now = _now_ts()
    if now - cookie.updated_at < COOKIE_REFRESH_AFTER_DAYS * 24 * 60 * 60:
        return
    refreshed = TrustCookie(
        updated_at=now,
        expires_at=int(
            (
                datetime.fromtimestamp(now, tz=UTC) + timedelta(days=COOKIE_TTL_DAYS)
            ).timestamp()
        ),
        entries=cookie.entries,
    )
    set_trust_cookie(response, refreshed)


def is_trusted(
    cookie: TrustCookie | None, *, address: str, required_scopes: list[str]
) -> bool:
    if not cookie:
        return False
    addr = address.lower()
    for e in cookie.entries:
        if e.address != addr:
            continue
        return all(scope in e.scopes for scope in required_scopes)
    return False


def require_trusted_address(
    request: Request,
    *,
    address: str,
    required_scopes: list[str],
) -> TrustCookie:
    cookie = read_trust_cookie(request)
    if not is_trusted(cookie, address=address, required_scopes=required_scopes):
        raise exceptions.NotAuthenticated("Wallet not trusted on this device")
    assert cookie is not None
    return cookie
