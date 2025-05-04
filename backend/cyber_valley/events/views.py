import time
from pathlib import Path

import ipfshttpclient
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from drf_spectacular.utils import (
    PolymorphicProxySerializer,
    extend_schema,
    extend_schema_view,
)
from rest_framework import viewsets
from rest_framework.decorators import (
    api_view,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Event, EventPlace
from .serializers import (
    CreatorEventSerializer,
    EventPlaceSerializer,
    EventSerializer,
    StaffEventSerializer,
)


class EventPlaceViewSet(viewsets.ReadOnlyModelViewSet[EventPlace]):
    """
    API endpoint that allows event places to be viewed
    """

    queryset = EventPlace.objects.all().prefetch_related("event_set")
    serializer_class = EventPlaceSerializer
    permission_classes = (IsAuthenticated,)


@extend_schema_view(
    list=extend_schema(
        description="Available events in the syste",
        responses=PolymorphicProxySerializer(
            component_name="RoleBasedEvent",
            serializers=[CreatorEventSerializer, StaffEventSerializer],
            resource_type_field_name=None,
        ),
    )
)
class EventViewSet(viewsets.ReadOnlyModelViewSet[Event]):
    queryset = Event.objects.all()
    serializer_class = StaffEventSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self) -> type[EventSerializer]:
        if self.request.user.is_staff:
            return StaffEventSerializer

        return CreatorEventSerializer


@extend_schema(
    request={
        "multipart/form-data": bytes,
    },
    responses={204: str},
)
@api_view(["PUT"])
@parser_classes([FormParser, MultiPartParser])
@permission_classes([IsAuthenticated])
def upload_event_cover_to_ipfs(request: Request) -> Response:
    user = request.user
    assert not isinstance(user, AnonymousUser)
    file = request.FILES["cover"]
    target_base_path = settings.IPFS_DATA_PATH / user.address / "events"
    target_base_path.mkdir(exist_ok=True, parents=True)
    extension = Path(file.name).suffix
    result_path = target_base_path / f"{int(time.time())}{extension}"
    result_path.write_bytes(file.read())
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        cover_hash = client.add(result_path)["Hash"]
    return Response(cover_hash, content_type="text/plain")
