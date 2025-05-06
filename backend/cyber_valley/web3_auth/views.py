import secrets
from datetime import UTC, datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.middleware import csrf
from drf_spectacular.utils import (
    extend_schema,
)
from rest_framework import exceptions
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import SIWEModelSerializer
from .service import verify_signature

User = get_user_model()


@extend_schema(
    request=SIWEModelSerializer,
    responses={(200, "text/html"): str, (204, "applicaiton/json"): None},
)
@api_view(["POST", "GET"])
@renderer_classes([JSONRenderer, TemplateHTMLRenderer])
def login(request: Request) -> Response:
    if request.method == "GET":
        return Response(template_name="login_ethereum.html")

    data = SIWEModelSerializer(data=request.data)
    data.is_valid(raise_exception=True)
    data = data.save()

    if not cache.delete(data.nonce):
        return Response("Nonce expired or invalid", status=400)

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
    response.set_cookie(
        key=settings.SIMPLE_JWT["REFRESH_COOKIE"],
        value=str(token),
        expires=datetime.now(tz=UTC) + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )

    csrf.get_token(request)

    return response


@api_view(["GET"])
def refresh(request: Request) -> Response:
    cookie_name = settings.SIMPLE_JWT["REFRESH_COOKIE"]
    raw_token = request.COOKIES.get(cookie_name)
    if not raw_token:
        return Response(
            f"Refresh token cookie ({cookie_name}) was not provided", status=400
        )

    # Should be ok because used the same in the original source code
    refresh = RefreshToken(raw_token)  # type: ignore[arg-type]
    address = refresh.payload.get("user_id", None)
    print(f"DEBUG {refresh.payload=}")
    try:
        User.objects.get(address=address)
    except User.DoesNotExist:
        return Response(status=404)

    refresh.set_jti()
    refresh.set_exp()
    refresh.set_iat()

    response = Response(
        status=204,
    )

    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE"],
        value=str(refresh.access_token),
        expires=datetime.now(tz=UTC) + settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )
    response.set_cookie(
        key=settings.SIMPLE_JWT["REFRESH_COOKIE"],
        value=str(refresh),
        expires=refresh.payload["exp"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
    )

    csrf.get_token(request)

    return response


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


@api_view(["GET"])
def logout(_request: Request) -> Response:
    response = Response(status=200)
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
    response.delete_cookie(settings.SIMPLE_JWT["REFRESH_COOKIE"])
    return response
