import ipfshttpclient
from django.contrib.auth.models import AnonymousUser
from drf_spectacular.utils import (
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

from .models import CyberValleyUser
from .serializers import CurrentUserSerializer, UploadSocialsSerializer


class CurrentUserViewSet(viewsets.GenericViewSet[CyberValleyUser]):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses=CurrentUserSerializer)
    @action(detail=False, methods=["get"], name="Current user")
    def current(self, request: Request) -> Response:
        assert request.user.is_authenticated
        serializer = CurrentUserSerializer(request.user)
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
