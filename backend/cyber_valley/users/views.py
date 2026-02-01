import ipfshttpclient
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
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
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import CyberValleyUser, UserSocials
from .serializers import (
    CurrentUserSerializer,
    SaveSocialsSerializer,
    StaffSerializer,
    UploadSocialsSerializer,
)

User = get_user_model()


class CurrentUserViewSet(viewsets.GenericViewSet[CyberValleyUser]):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses=CurrentUserSerializer)
    @action(detail=False, methods=["get"], name="Current user")
    def current(self, request: Request) -> Response:
        assert request.user.is_authenticated
        serializer = CurrentUserSerializer(request.user)
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
        assert request.user.is_authenticated
        if not request.user.has_role(
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
        assert request.user.is_authenticated
        if not request.user.has_role(CyberValleyUser.MASTER):
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
        assert request.user.is_authenticated
        if request.user.role not in (
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
@permission_classes([IsAuthenticated])
def upload_user_socials_to_ipfs(request: Request) -> Response:
    socials = UploadSocialsSerializer(data=request.data)
    socials.is_valid(raise_exception=True)
    user = request.user
    assert not isinstance(user, AnonymousUser)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_hash = client.add_json(socials.data)
    return Response({"cid": socials_hash})


@extend_schema(
    request=SaveSocialsSerializer,
    responses={201: SaveSocialsSerializer},
)
@api_view(["POST"])
@parser_classes([JSONParser])
@permission_classes([IsAuthenticated])
def save_user_socials(request: Request) -> Response:
    user = request.user
    assert not isinstance(user, AnonymousUser)

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
