from typing import Any

from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import AuthUser, JWTAuthentication
from rest_framework_simplejwt.tokens import Token


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request: Request) -> None | tuple[AuthUser, Token]:
        header = self.get_header(request)

        if header is None:
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"]) or None
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        # Weird generic AuthUser forces return of both bounded types
        return self.get_user(validated_token), validated_token  # type: ignore


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):  # type: ignore[no-untyped-call]
    target_class = "cyber_valley.web3_auth.authenticate.CookieJWTAuthentication"
    name = "cookieJWTAuth"

    def get_security_definition(self, auto_schema: Any) -> dict[str, Any]:  # noqa: ARG002
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.SIMPLE_JWT["AUTH_COOKIE"],
            "description": "JSON Web Token authentication via cookie",
        }
