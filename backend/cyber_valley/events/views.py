import secrets
import time
from pathlib import Path

import ipfshttpclient
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.forms.models import model_to_dict
from django.shortcuts import get_object_or_404
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
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Event, EventPlace, Ticket
from .serializers import (
    CreatorEventSerializer,
    EventPlaceSerializer,
    EventSerializer,
    StaffEventSerializer,
    UploadEventMetaToIpfsSerializer,
    UploadPlaceMetaToIpfsSerializer,
    UploadTicketMetaToIpfsSerializer,
)


class EventPlaceViewSet(viewsets.ReadOnlyModelViewSet[EventPlace]):
    queryset = EventPlace.objects.all().prefetch_related("event_set")
    serializer_class = EventPlaceSerializer


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

    def get_serializer_class(self) -> type[EventSerializer]:
        if self.request.user.is_staff:
            return StaffEventSerializer

        return CreatorEventSerializer


@extend_schema(
    request=UploadEventMetaToIpfsSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {"cid": {"type": "string"}},
            "description": "IPFS CID of stored data",
        }
    },
)
@api_view(["PUT"])
@parser_classes([MultiPartParser])
@permission_classes([IsAuthenticated])
def upload_event_meta_to_ipfs(request: Request) -> Response:
    meta = UploadEventMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    user = request.user
    assert not isinstance(user, AnonymousUser)
    target_base_path = settings.IPFS_DATA_PATH / "users" / user.address / "events"
    target_base_path.mkdir(exist_ok=True, parents=True)
    # FIXME: Can be a name without a suffix
    assert meta.cover.name
    extension = Path(meta.cover.name).suffix
    assert extension
    result_path = target_base_path / f"{int(time.time())}{extension}"
    result_path.write_bytes(meta.cover.read())
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        cover_hash = client.add(result_path)["Hash"]
        event_meta = {
            "title": meta.title,
            "description": meta.description,
            "website": meta.website,
            "cover": cover_hash,
            "socialsCid": meta.socials_cid,
        }
        meta_hash = client.add_json(event_meta)
    return Response({"cid": meta_hash})


@extend_schema(
    request=UploadPlaceMetaToIpfsSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {"cid": {"type": "string"}},
            "description": "IPFS CID of stored data",
        }
    },
)
@api_view(["PUT"])
@parser_classes([MultiPartParser])
@permission_classes([IsAuthenticated])
def upload_place_meta_to_ipfs(request: Request) -> Response:
    meta = UploadPlaceMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    user = request.user
    assert not isinstance(user, AnonymousUser)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        event_meta = {"title": meta.title, "location_url": meta.location_url}
        meta_hash = client.add_json(event_meta)
    return Response({"cid": meta_hash})


@extend_schema(
    request=UploadTicketMetaToIpfsSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {"cid": {"type": "string"}},
            "description": "IPFS CID of ticket NFT",
        }
    },
)
@api_view(["PUT"])
@parser_classes([MultiPartParser])
@permission_classes([IsAuthenticated])
def upload_ticket_meta_to_ipfs(request: Request) -> Response:
    meta = UploadTicketMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    user = request.user
    assert not isinstance(user, AnonymousUser)
    # TODO: Fetch event's img url
    event = get_object_or_404(Event, id=meta.eventid)
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_hash = client.add_json(model_to_dict(meta.socials))
        event_meta = {"socials": socials_hash, "image": event.image_url}
        meta_hash = client.add_json(event_meta)
    return Response({"cid": meta_hash})


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {"nonce": {"type": "string"}},
        }
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ticket_nonce(request: Request, event_id: int, ticket_id: str) -> Response:
    user = request.user
    assert not isinstance(user, AnonymousUser)
    nonce = user.address + secrets.token_hex(16)
    key = f"{nonce}:{event_id}:{ticket_id}"
    cache.set(key, "nonce", timeout=60 * 5)
    return Response({"nonce": nonce})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_ticket(
    request: Request, event_id: int, ticket_id: str, nonce: str
) -> Response:
    user = request.user
    assert not isinstance(user, AnonymousUser)

    key = f"{nonce}:{event_id}:{ticket_id}"
    if not cache.delete(key):
        return Response("Nonce expired or invalid", status=404)

    ticket = get_object_or_404(Ticket, id=ticket_id)
    if ticket.is_redeemed:
        return Response("redeemed", status=409)
    if ticket.pending_is_redeemed:
        return Response("pending redeem", status=202)

    ticket.pending_is_redeemed = True
    ticket.save()

    return Response("no redeem", status=200)


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {
                "tickets": {
                    "type": "object",
                    "properties": {
                        "total": {"type": "integer"},
                        "redeemed": {"type": "integer"},
                    },
                }
            },
        }
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def event_status(_: Request, event_id: int) -> Response:
    event = get_object_or_404(Event, id=event_id)
    redeemed = Ticket.objects.filter(event_id=event_id, is_redeemed=True).count()
    return Response(
        {
            "tickets": {
                "total": event.tickets_bought,
                "redeemed": redeemed,
            }
        }
    )
