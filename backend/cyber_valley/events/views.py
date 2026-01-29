import logging
import secrets
import time
from pathlib import Path

import ipfshttpclient
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.db.models import Case, IntegerField, Q, When
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiParameter,
    PolymorphicProxySerializer,
    extend_schema,
    extend_schema_view,
)
from rest_framework import viewsets
from rest_framework.decorators import (
    action,
    api_view,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from django.db.models.query import QuerySet

from .models import Event, EventPlace, Ticket
from .serializers import (
    AttendeeSerializer,
    CreatorEventSerializer,
    EventPlaceSerializer,
    EventSerializer,
    StaffEventSerializer,
    TicketCategorySerializer,
    UploadEventMetaToIpfsSerializer,
    UploadPlaceMetaToIpfsSerializer,
    UploadTicketMetaToIpfsSerializer,
)
from .ticket_serializer import TicketSerializer

log = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search places by name or provider address",
                required=False,
            ),
        ],
    )
)
class EventPlaceViewSet(viewsets.ReadOnlyModelViewSet[EventPlace]):
    queryset = EventPlace.objects.filter(status="approved").prefetch_related(
        "event_set"
    )
    serializer_class = EventPlaceSerializer

    def get_queryset(self) -> QuerySet[EventPlace]:
        queryset = EventPlace.objects.filter(status="approved").prefetch_related(
            "event_set"
        )
        search_query = self.request.query_params.get("search", "")
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query)
                | Q(provider__address__icontains=search_query)
            )
        return queryset


@extend_schema_view(
    list=extend_schema(
        description="Available events in the system",
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search events by title, place name, or creator address",
                required=False,
            ),
        ],
        responses=PolymorphicProxySerializer(
            component_name="RoleBasedEvent",
            serializers=[CreatorEventSerializer, StaffEventSerializer],
            resource_type_field_name=None,
        ),
    )
)
class EventViewSet(viewsets.ReadOnlyModelViewSet[Event]):
    queryset = Event.objects.annotate(
        status_priority=Case(
            When(status="approved", then=1),
            When(status="submitted", then=2),
            When(status="cancelled", then=3),
            When(status="closed", then=4),
            When(status="declined", then=5),
            output_field=IntegerField(),
        )
    ).order_by("status_priority", "-created_at")
    serializer_class = StaffEventSerializer

    def get_queryset(self) -> QuerySet[Event]:
        queryset = Event.objects.annotate(
            status_priority=Case(
                When(status="approved", then=1),
                When(status="submitted", then=2),
                When(status="cancelled", then=3),
                When(status="closed", then=4),
                When(status="declined", then=5),
                output_field=IntegerField(),
            )
        ).order_by("status_priority", "-created_at")
        search_query = self.request.query_params.get("search", "")
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query)
                | Q(place__title__icontains=search_query)
                | Q(creator__address__icontains=search_query)
            )
        return queryset

    def get_serializer_class(self) -> type[EventSerializer]:
        if self.request.user.is_staff:
            return StaffEventSerializer

        return CreatorEventSerializer

    @extend_schema(
        responses=AttendeeSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Search attendees by address or social media handles",
                required=False,
            ),
        ],
    )
    @action(detail=True, methods=["get"], name="Event Attendees")
    def attendees(self, request: Request, pk: int | None = None) -> Response:
        event = get_object_or_404(Event, pk=pk)
        tickets = Ticket.objects.filter(event=event).select_related("owner")
        search_query = request.query_params.get("search", "")
        if search_query:
            tickets = tickets.filter(
                Q(owner__address__icontains=search_query)
                | Q(owner__socials__value__icontains=search_query)
            )
        serializer = AttendeeSerializer([ticket.owner for ticket in tickets], many=True)
        return Response(serializer.data)


@extend_schema(
    responses=TicketCategorySerializer(many=True),
)
@api_view(["GET"])
@permission_classes([AllowAny])
def event_categories(_request: Request, event_id: int) -> Response:
    event = get_object_or_404(Event, id=event_id)
    categories = event.categories.order_by("category_id")
    return Response(TicketCategorySerializer(categories, many=True).data)


# NOTE: There is a problem with DNS to fetch event meta info via HTTP
# during seeding, so the easiest way is to return cover's IPFS CID directly
@extend_schema(
    request=UploadEventMetaToIpfsSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {"cid": {"type": "string"}, "cover": {"type": "string"}},
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
    return Response({"cid": meta_hash, "cover": cover_hash})


@extend_schema(
    request=UploadPlaceMetaToIpfsSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {"cid": {"type": "string"}},
            "description": "IPFS CID of stored place metadata",
        }
    },
    description=(
        "Upload event place metadata to IPFS. The metadata includes "
        "the place title and GeoJSON Point geometry with coordinates."
    ),
    summary="Upload place metadata to IPFS",
)
@api_view(["PUT"])
@parser_classes([MultiPartParser])
@permission_classes([IsAuthenticated])
def upload_place_meta_to_ipfs(request: Request) -> Response:
    meta = UploadPlaceMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    meta.geometry["name"] = "Event palce marker"
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        event_meta = {"title": meta.title, "geometry": meta.geometry}
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
@permission_classes([IsAuthenticated])
def upload_ticket_meta_to_ipfs(request: Request) -> Response:
    meta = UploadTicketMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    user = request.user
    assert not isinstance(user, AnonymousUser)
    # TODO: Fetch event's img url
    try:
        event = Event.objects.get(id=meta.eventid)
        event_data = {
            "image": event.image_url,
            "name": f"Ticket to {event.title}",
        }
    except Event.DoesNotExist:
        if not meta.eventcover or not meta.eventtitle:
            return Response("event not found", status=404)

        event_data = {
            "image": meta.eventcover,
            "name": f"Ticket to {meta.eventtitle}",
        }

    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_hash = client.add_json(meta.socials)
        event_meta = {
            "socials": socials_hash,
            "description": "Your way to attend the event",
            **event_data,
        }
        meta_hash = client.add_json(event_meta)

    log.info(
        "saving metadata for the new ticket: %s with cid %s", event_meta, meta_hash
    )
    return Response({"cid": meta_hash}, status=201)


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


@extend_schema(responses=TicketSerializer)
@api_view(["GET"])
@permission_classes([])
def ticket_info(_: Request, event_id: int, ticket_id: str) -> Response:
    data = get_object_or_404(Ticket, event__id=event_id, id=ticket_id)
    resp = TicketSerializer(data)
    return Response(resp.data, status=200)


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

    ticket = get_object_or_404(Ticket, id=ticket_id, event__id=event_id)
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


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {
                "total_revenue": {
                    "type": "integer",
                    "description": "Total revenue in USDT (6 decimals)",
                },
                "ticket_revenue": {
                    "type": "integer",
                    "description": "Revenue from ticket sales",
                },
                "deposit": {"type": "integer", "description": "Event request deposit"},
                "tickets_sold": {
                    "type": "integer",
                    "description": "Number of tickets sold",
                },
            },
        }
    }
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lifetime_revenue(_: Request, event_id: int) -> Response:
    event = get_object_or_404(Event, id=event_id)
    return Response(
        {
            "total_revenue": event.total_revenue + event.paid_deposit,
            "ticket_revenue": event.total_revenue,
            "deposit": event.paid_deposit,
            "tickets_sold": event.tickets_bought,
        }
    )
