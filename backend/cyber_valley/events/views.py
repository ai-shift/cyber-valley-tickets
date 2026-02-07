import logging
import secrets
import time
from pathlib import Path
from typing import Any

import ipfshttpclient
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Case, Count, IntegerField, Q, When
from django.db.models.query import QuerySet
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
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from cyber_valley.common.request_address import get_or_create_user_by_address, require_address

from .models import DistributionProfile, Event, EventPlace, Ticket
from .serializers import (
    AttendeeSerializer,
    CreatorEventSerializer,
    DistributionProfileSerializer,
    EventPlaceSerializer,
    EventSerializer,
    StaffEventSerializer,
    TicketCategorySerializer,
    UploadEventMetaToIpfsSerializer,
    UploadOrderMetaToIpfsSerializer,
    UploadPlaceMetaToIpfsSerializer,
    UploadTicketMetaToIpfsSerializer,
)
from .ticket_serializer import TicketSerializer

User = get_user_model()
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
        search_query = request.query_params.get("search", "")

        # Get unique owners with ticket counts
        owner_addresses = (
            Ticket.objects.filter(event=event)
            .values_list("owner_id", flat=True)
            .distinct()
        )

        # Get owners with ticket count annotation
        owners = User.objects.filter(address__in=owner_addresses).annotate(
            tickets_count=Count("tickets", filter=Q(tickets__event=event))
        )

        if search_query:
            owners = owners.filter(
                Q(address__icontains=search_query)
                | Q(socials__value__icontains=search_query)
            )

        serializer = AttendeeSerializer(owners, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses={
            200: StaffEventSerializer,
            404: {"type": "object", "properties": {"detail": {"type": "string"}}},
        },
        description="Get an event by its creation transaction hash",
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="by-tx-hash/(?P<tx_hash>0x[a-fA-F0-9]+)",
        url_name="by-tx-hash",
    )
    def by_tx_hash(self, _request: Request, tx_hash: str) -> Response:
        event = get_object_or_404(Event, creation_tx_hash=tx_hash.lower())
        serializer = self.get_serializer(event)
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
@permission_classes([AllowAny])
def upload_event_meta_to_ipfs(request: Request) -> Response:
    meta = UploadEventMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    target_base_path = (
        settings.IPFS_DATA_PATH / "users" / meta.address.lower() / "events"
    )
    target_base_path.mkdir(exist_ok=True, parents=True)

    # Handle file extension safely
    extension = ".jpg"  # default extension
    if meta.cover.name:
        detected = Path(meta.cover.name).suffix
        if detected:
            extension = detected
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
@permission_classes([AllowAny])
def upload_place_meta_to_ipfs(request: Request) -> Response:
    meta = UploadPlaceMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
    meta.geometry["name"] = "Event palce marker"
    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        event_meta = {
            "title": meta.title,
            "geometry": meta.geometry,
            "eventDepositSize": meta.event_deposit_size,
        }
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
@permission_classes([AllowAny])
def upload_ticket_meta_to_ipfs(request: Request) -> Response:
    meta = UploadTicketMetaToIpfsSerializer(data=request.data)
    meta.is_valid(raise_exception=True)
    meta = meta.save()
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
    request=UploadOrderMetaToIpfsSerializer,
    responses={
        201: {
            "type": "object",
            "properties": {"cid": {"type": "string"}},
            "description": "IPFS CID of order metadata",
        }
    },
)
@api_view(["PUT"])
@permission_classes([AllowAny])
def upload_order_meta_to_ipfs(request: Request) -> Response:
    serializer = UploadOrderMetaToIpfsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order_data = serializer.save()
    try:
        event = Event.objects.get(id=order_data.event_id)
        event_image = event.image_url
        event_title = event.title
    except Event.DoesNotExist:
        return Response("event not found", status=404)

    with ipfshttpclient.connect() as client:  # type: ignore[attr-defined]
        socials_hash = client.add_json(order_data.socials)
        tickets_data = [
            {
                "category_id": t.category_id,
                "category_name": t.category_name,
                "price": t.price,
                "quantity": t.quantity,
            }
            for t in order_data.tickets
        ]
        order_meta = {
            "order_type": "ticket_purchase",
            "event_id": order_data.event_id,
            "event_title": event_title,
            "event_image": event_image,
            "buyer": {
                "address": order_data.buyer_address,
                "socials": socials_hash,
            },
            "tickets": tickets_data,
            "total_tickets": order_data.total_tickets,
            "total_price": order_data.total_price,
            "currency": order_data.currency,
            "referral_data": order_data.referral_data,
        }
        meta_hash = client.add_json(order_meta)

    log.info("saving metadata for the new order: %s with cid %s", order_meta, meta_hash)
    return Response({"cid": meta_hash}, status=201)


@extend_schema(
    operation_id="api_events_tickets_nonce_generate",
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {"nonce": {"type": "string"}},
        }
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def ticket_nonce(request: Request, event_id: int, ticket_id: str) -> Response:
    from cyber_valley.users.models import CyberValleyUser

    user = get_or_create_user_by_address(require_address(request))

    # Get the ticket and verify ownership
    ticket = get_object_or_404(Ticket, id=ticket_id, event__id=event_id)

    # Allow nonce generation for: ticket owner, staff, or master
    is_owner = ticket.owner.address.lower() == user.address.lower()
    is_staff_or_master = user.has_role(CyberValleyUser.STAFF, CyberValleyUser.MASTER)

    if not (is_owner or is_staff_or_master):
        return Response("Only ticket owner or staff can generate nonce", status=403)

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


@extend_schema(
    operation_id="api_events_tickets_verify",
    parameters=[
        OpenApiParameter(name="event_id", type=int, location=OpenApiParameter.PATH),
        OpenApiParameter(name="ticket_id", type=str, location=OpenApiParameter.PATH),
        OpenApiParameter(name="nonce", type=str, location=OpenApiParameter.PATH),
    ],
    responses={
        200: {"type": "string", "example": "no redeem"},
        202: {"type": "string", "example": "pending redeem"},
        403: {"type": "string", "example": "Only staff or master can verify tickets"},
        404: {"type": "string", "example": "Nonce expired or invalid"},
        409: {"type": "string", "example": "redeemed"},
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def verify_ticket(
    request: Request, event_id: int, ticket_id: str, nonce: str
) -> Response:
    from cyber_valley.users.models import CyberValleyUser

    user = get_or_create_user_by_address(require_address(request))

    # Only staff or master can verify tickets
    if not user.has_role(CyberValleyUser.STAFF, CyberValleyUser.MASTER):
        return Response("Only staff or master can verify tickets", status=403)

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
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
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


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {
                "totalRevenue": {
                    "type": "integer",
                    "description": (
                        "Total revenue across all events in USDT (6 decimals)"
                    ),
                },
            },
        }
    }
)
@api_view(["GET"])
def total_revenue(_: Request) -> Response:
    from django.db.models import Sum

    total = Event.objects.aggregate(
        total=Sum("total_revenue") + Sum("paid_deposit"),
    )["total"]

    return Response({"totalRevenue": total or 0})


@extend_schema(
    responses={
        (200, "application/json"): {
            "type": "object",
            "properties": {
                "places": {
                    "type": "object",
                    "properties": {
                        "providers": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "address": {"type": "string"},
                                    "currentWeek": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                            "averageVerificationTime": {
                                                "type": "integer"
                                            },
                                        },
                                    },
                                    "previousWeek": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                            "averageVerificationTime": {
                                                "type": "integer"
                                            },
                                        },
                                    },
                                    "diff": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                "events": {
                    "type": "object",
                    "properties": {
                        "providers": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "address": {"type": "string"},
                                    "currentWeek": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                            "averageVerificationTime": {
                                                "type": "integer"
                                            },
                                        },
                                    },
                                    "previousWeek": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                            "averageVerificationTime": {
                                                "type": "integer"
                                            },
                                        },
                                    },
                                    "diff": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                "shamans": {
                    "type": "object",
                    "properties": {
                        "providers": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "address": {"type": "string"},
                                    "currentWeek": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                            "averageVerificationTime": {
                                                "type": "integer"
                                            },
                                        },
                                    },
                                    "previousWeek": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                            "averageVerificationTime": {
                                                "type": "integer"
                                            },
                                        },
                                    },
                                    "diff": {
                                        "type": "object",
                                        "properties": {
                                            "pending": {"type": "integer"},
                                            "verified": {"type": "integer"},
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
)
@api_view(["GET"])
@permission_classes([AllowAny])
def verification_stats(_request: Request) -> Response:
    """Get verification statistics per local provider."""
    from datetime import timedelta

    from django.utils import timezone

    from cyber_valley.shaman_verification.models import VerificationRequest
    from cyber_valley.users.models import CyberValleyUser

    # Calculate week boundaries
    today = timezone.now()
    days_since_monday = today.weekday()
    current_monday = today - timedelta(days=days_since_monday)
    current_monday = current_monday.replace(hour=0, minute=0, second=0, microsecond=0)
    previous_monday = current_monday - timedelta(weeks=1)
    current_sunday = current_monday + timedelta(
        days=6, hours=23, minutes=59, seconds=59
    )
    previous_sunday = previous_monday + timedelta(
        days=6, hours=23, minutes=59, seconds=59
    )

    def calculate_provider_stats(
        queryset: QuerySet[Any],
        provider_field: str = "provider",
    ) -> list[dict[str, Any]]:
        """Calculate verification stats per provider."""
        pending_statuses = ["submitted", "pending"]
        verified_statuses = ["approved"]

        provider_stats = []

        # Get all local providers
        providers = CyberValleyUser.objects.filter(
            roles__name=CyberValleyUser.LOCAL_PROVIDER
        )

        for provider in providers:
            provider_queryset = queryset.filter(**{f"{provider_field}": provider})

            pending = provider_queryset.filter(status__in=pending_statuses).count()
            verified = provider_queryset.filter(status__in=verified_statuses).count()

            # Calculate average verification time for approved items
            approved_items = provider_queryset.filter(status__in=verified_statuses)
            total_verification_time = 0
            count = 0

            for item in approved_items:
                created = item.created_at
                updated = item.updated_at
                if updated and created:
                    verification_time = (updated - created).total_seconds()
                    total_verification_time += verification_time
                    count += 1

            avg_verification_time = (
                int(total_verification_time / count) if count > 0 else 0
            )

            if pending > 0 or verified > 0:
                provider_stats.append(
                    {
                        "address": provider.address,
                        "pending": pending,
                        "verified": verified,
                        "averageVerificationTime": avg_verification_time,
                    }
                )

        return provider_stats

    # Current week stats
    current_week_events = Event.objects.filter(
        created_at__gte=current_monday, created_at__lte=current_sunday
    )
    current_week_places = EventPlace.objects.filter(
        created_at__gte=current_monday, created_at__lte=current_sunday
    )
    current_week_shamans = VerificationRequest.objects.filter(
        created_at__gte=current_monday, created_at__lte=current_sunday
    )

    # Previous week stats
    previous_week_events = Event.objects.filter(
        created_at__gte=previous_monday, created_at__lte=previous_sunday
    )
    previous_week_places = EventPlace.objects.filter(
        created_at__gte=previous_monday, created_at__lte=previous_sunday
    )
    previous_week_shamans = VerificationRequest.objects.filter(
        created_at__gte=previous_monday, created_at__lte=previous_sunday
    )

    def build_provider_response(
        provider_data: list[dict[str, Any]],
        prev_provider_data: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Build provider response with diff calculations."""
        # Create lookup for previous week data
        prev_lookup = {p["address"]: p for p in prev_provider_data}

        result = []
        for curr in provider_data:
            address = curr["address"]
            prev = prev_lookup.get(
                address,
                {
                    "pending": 0,
                    "verified": 0,
                    "averageVerificationTime": 0,
                },
            )

            result.append(
                {
                    "address": address,
                    "currentWeek": {
                        "pending": curr["pending"],
                        "verified": curr["verified"],
                        "averageVerificationTime": curr["averageVerificationTime"],
                    },
                    "previousWeek": {
                        "pending": prev.get("pending", 0),
                        "verified": prev.get("verified", 0),
                        "averageVerificationTime": prev.get(
                            "averageVerificationTime", 0
                        ),
                    },
                    "diff": {
                        "pending": curr["pending"] - prev.get("pending", 0),
                        "verified": curr["verified"] - prev.get("verified", 0),
                    },
                }
            )

        # Add providers that only exist in previous week
        curr_addresses = {p["address"] for p in provider_data}
        result.extend(
            [
                {
                    "address": prev["address"],
                    "currentWeek": {
                        "pending": 0,
                        "verified": 0,
                        "averageVerificationTime": 0,
                    },
                    "previousWeek": {
                        "pending": prev["pending"],
                        "verified": prev["verified"],
                        "averageVerificationTime": prev["averageVerificationTime"],
                    },
                    "diff": {
                        "pending": -prev["pending"],
                        "verified": -prev["verified"],
                    },
                }
                for prev in prev_provider_data
                if prev["address"] not in curr_addresses
            ]
        )

        return result

    # Calculate provider stats
    places_current = calculate_provider_stats(current_week_places, "provider")
    places_previous = calculate_provider_stats(previous_week_places, "provider")
    events_current = calculate_provider_stats(current_week_events, "place__provider")
    events_previous = calculate_provider_stats(previous_week_events, "place__provider")

    # For shamans, we group by requester
    shamans_current = calculate_provider_stats(current_week_shamans, "requester")
    shamans_previous = calculate_provider_stats(previous_week_shamans, "requester")

    return Response(
        {
            "places": {
                "providers": build_provider_response(places_current, places_previous)
            },
            "events": {
                "providers": build_provider_response(events_current, events_previous)
            },
            "shamans": {
                "providers": build_provider_response(shamans_current, shamans_previous)
            },
        }
    )


# ... (all the existing content from views.py) ...

# ============================================================================
# Distribution Profile Views
# ============================================================================


@extend_schema_view(
    list=extend_schema(
        description="Get distribution profiles owned by the current user",
    ),
    retrieve=extend_schema(
        description="Get a specific distribution profile",
        parameters=[
            OpenApiParameter(
                name="id",
                type=int,
                location=OpenApiParameter.PATH,
                description="Distribution profile ID",
            ),
        ],
    ),
)
class DistributionProfileViewSet(viewsets.ReadOnlyModelViewSet[DistributionProfile]):
    """Read-only viewset for distribution profiles.

    Returns profiles owned by the authenticated user.
    Master users can see all profiles.
    """

    serializer_class = DistributionProfileSerializer
    permission_classes = (AllowAny,)
    lookup_field = "id"

    def get_queryset(self) -> QuerySet[DistributionProfile]:
        from cyber_valley.users.models import CyberValleyUser

        user = get_or_create_user_by_address(require_address(self.request))
        # Master can see all profiles
        if user.is_staff or user.has_role(CyberValleyUser.MASTER):
            return DistributionProfile.objects.all()
        # Regular users see only their own profiles
        return DistributionProfile.objects.filter(owner=user)
