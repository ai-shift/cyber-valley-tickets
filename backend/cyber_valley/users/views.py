from typing import Any

import ipfshttpclient
from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
)
from rest_framework import viewsets
from rest_framework.decorators import (
    action,
    api_view,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.common.request_address import (
    extract_address,
    get_or_create_user_by_address,
    require_address,
)

from .models import CyberValleyUser, UserSocials
from .serializers import (
    CurrentUserSerializer,
    SaveSocialsSerializer,
    StaffSerializer,
    UploadSocialsSerializer,
)

User = get_user_model()


class CurrentUserViewSet(viewsets.GenericViewSet[CyberValleyUser]):
    permission_classes = (AllowAny,)

    @extend_schema(responses=CurrentUserSerializer)
    @action(detail=False, methods=["get"], name="Current user")
    def current(self, request: Request) -> Response:
        address = require_address(request)
        user = get_or_create_user_by_address(address)
        serializer = CurrentUserSerializer(user)
        return Response(serializer.data)

    @extend_schema(
        responses=StaffSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search staff by address or social media handles",
                required=False,
            ),
        ],
    )
    @action(detail=False, methods=["get"], name="Current user")
    def staff(self, request: Request) -> Response:
        address = require_address(request)
        requester = get_or_create_user_by_address(address)
        if not requester.has_role(
            CyberValleyUser.LOCAL_PROVIDER,
            CyberValleyUser.MASTER,
        ):
            return Response("Available only to local provider or master", status=401)
        staff = User.objects.filter(roles__name=CyberValleyUser.STAFF)
        search_query = request.query_params.get("search", "")
        if search_query:
            staff = staff.filter(
                Q(address__icontains=search_query)
                | Q(socials__value__icontains=search_query)
            )
        serializer = CurrentUserSerializer(staff, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses=CurrentUserSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search local providers by address or social media handles",
                required=False,
            ),
        ],
    )
    @action(detail=False, methods=["get"], name="Local Providers")
    def local_providers(self, request: Request) -> Response:
        address = require_address(request)
        requester = get_or_create_user_by_address(address)
        if not requester.has_role(CyberValleyUser.MASTER):
            return Response("Available only to master", status=401)
        local_providers = User.objects.filter(
            roles__name=CyberValleyUser.LOCAL_PROVIDER
        )
        search_query = request.query_params.get("search", "")
        if search_query:
            local_providers = local_providers.filter(
                Q(address__icontains=search_query)
                | Q(socials__value__icontains=search_query)
            )
        serializer = CurrentUserSerializer(local_providers, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses=CurrentUserSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search verified shamans by address or socials",
                required=False,
            ),
        ],
    )
    @action(detail=False, methods=["get"], name="Verified Shamans")
    def verified_shamans(self, request: Request) -> Response:
        address = require_address(request)
        requester = get_or_create_user_by_address(address)
        if not requester.has_role(
            CyberValleyUser.LOCAL_PROVIDER,
            CyberValleyUser.MASTER,
        ):
            return Response("Available only to local provider or master", status=401)
        verified_shamans = User.objects.filter(
            roles__name=CyberValleyUser.VERIFIED_SHAMAN
        )
        search_query = request.query_params.get("search", "")
        if search_query:
            verified_shamans = verified_shamans.filter(
                Q(address__icontains=search_query)
                | Q(socials__value__icontains=search_query)
            )
        serializer = CurrentUserSerializer(verified_shamans, many=True)
        return Response(serializer.data)


@extend_schema(
    request=UploadSocialsSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {"cid": {"type": "string"}},
            "description": "IPFS CID of stored data",
        }
    },
)
@api_view(["PUT"])
@parser_classes([JSONParser])
@permission_classes([AllowAny])
def upload_user_socials_to_ipfs(request: Request) -> Response:
    socials = UploadSocialsSerializer(data=request.data)
    socials.is_valid(raise_exception=True)
    get_or_create_user_by_address(require_address(request))
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_hash = client.add_json(socials.data)
    return Response({"cid": socials_hash})


@extend_schema(
    request=SaveSocialsSerializer,
    responses={201: SaveSocialsSerializer},
)
@api_view(["POST"])
@parser_classes([JSONParser])
@permission_classes([AllowAny])
def save_user_socials(request: Request) -> Response:
    user = get_or_create_user_by_address(require_address(request))

    serializer = SaveSocialsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    network = serializer.validated_data["network"]
    value = serializer.validated_data["value"]

    social, created = UserSocials.objects.update_or_create(
        user=user, network=network, defaults={"value": value}
    )

    response_serializer = SaveSocialsSerializer(social)
    status_code = 201 if created else 200

    return Response(response_serializer.data, status=status_code)


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "network": {"type": "string"},
                    "value": {"type": "string"},
                },
            },
        }
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_socials(_request: Request, address: str) -> Response:
    """Get social media handles for a user by address."""
    try:
        user = CyberValleyUser.objects.get(address=address.lower())
        socials = user.socials.all()
        data = [{"network": s.network, "value": s.value} for s in socials]
        return Response(data)
    except CyberValleyUser.DoesNotExist:
        return Response([], status=200)


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {
                "address": {"type": "string"},
                "ens": {"type": "string", "nullable": True},
                "avatar_url": {"type": "string"},
                "socials": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "network": {"type": "string"},
                            "value": {"type": "string"},
                        },
                    },
                },
                "roles": {"type": "array", "items": {"type": "string"}},
            },
        }
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_profile(request: Request, address: str) -> Response:
    """Get user profile info.

    Socials are only returned if requester is the user or has
    localprovider/master role.
    """
    try:
        target_user = CyberValleyUser.objects.get(address=address.lower())
        requester_address = extract_address(request)
        current_user = (
            get_or_create_user_by_address(requester_address)
            if requester_address
            else None
        )

        # Determine if socials should be visible.
        # Visible if: requester is the user OR has localprovider/master role.
        can_view_socials = False
        if isinstance(current_user, CyberValleyUser):
            can_view_socials = (
                current_user.address.lower() == address.lower()
                or current_user.has_role(
                    CyberValleyUser.LOCAL_PROVIDER,
                    CyberValleyUser.MASTER,
                )
            )

        # Build response data
        data: dict[str, Any] = {
            "address": target_user.address,
            "ens": None,  # ENS lookup happens on frontend
            "avatar_url": f"https://effigy.im/a/{target_user.address}.svg",
            "roles": [role.name for role in target_user.roles.all()],
        }

        # Only include socials if authorized
        if can_view_socials:
            socials = target_user.socials.all()
            data["socials"] = [
                {"network": s.network, "value": s.value} for s in socials
            ]
        else:
            data["socials"] = []

        return Response(data)
    except CyberValleyUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
