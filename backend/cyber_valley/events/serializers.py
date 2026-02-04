from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.core.files import File
from drf_spectacular.utils import (
    OpenApiExample,
    extend_schema_field,
    extend_schema_serializer,
)
from rest_framework import serializers

from cyber_valley.geodata.serializers import GeoFeatureSerializer
from cyber_valley.users.models import CyberValleyUser as UserType
from cyber_valley.users.models import UserSocials
from cyber_valley.users.serializers import UploadSocialsSerializer

from .models import DistributionProfile, Event, EventPlace, TicketCategory

User = get_user_model()


class EventPlaceSerializer(serializers.ModelSerializer[EventPlace]):
    is_used = serializers.SerializerMethodField()
    geometry = GeoFeatureSerializer()

    class Meta:
        model = EventPlace
        fields = (
            "id",
            "title",
            "max_tickets",
            "min_tickets",
            "min_price",
            "min_days",
            "geometry",
            "days_before_cancel",
            "event_deposit_size",
            "available",
            "status",
            "is_used",
        )

    def get_is_used(self, obj: EventPlace) -> bool:
        return obj.event_set.exclude(status__in=["closed", "cancelled"]).exists()


class CreatorSerializer(serializers.ModelSerializer[UserType]):
    socials = serializers.SerializerMethodField()

    @extend_schema_field(UploadSocialsSerializer)
    def get_socials(self, obj: UserType) -> dict[str, Any]:
        last_social = obj.socials.order_by("id").last()
        if not last_social:
            return {}

        value: str = last_social.value
        # For telegram, use username from metadata or "no username"
        if last_social.network == UserSocials.Network.TELEGRAM:
            username = (
                last_social.metadata.get("username") if last_social.metadata else None
            )
            value = username or "no username"

        return {"network": last_social.network, "value": value}

    class Meta:
        model = User
        fields = ("address", "socials")


class AttendeeSerializer(CreatorSerializer):
    tickets_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ("address", "socials", "tickets_count")


class EventSerializer(serializers.ModelSerializer[Event]):
    place = EventPlaceSerializer(required=True)
    creator = CreatorSerializer(required=True)
    start_date_timestamp = serializers.SerializerMethodField()
    total_revenue = serializers.IntegerField(read_only=True)
    paid_deposit = serializers.IntegerField(read_only=True)
    ticket_price_range = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "creator",
            "status",
            "title",
            "description",
            "place",
            "place_id",
            "ticket_price",
            "ticket_price_range",
            "days_amount",
            "image_url",
            "website",
            "start_date_timestamp",
            "tickets_bought",
            "total_revenue",
            "paid_deposit",
        )

    def get_start_date_timestamp(self, obj: Event) -> int:
        return int(obj.start_date.timestamp())

    def get_ticket_price_range(self, obj: Event) -> dict[str, int | None]:
        """
        Calculate the min and max available ticket prices from categories.
        Excludes categories that are sold out (quota exceeded).
        Returns None for min/max if no categories are available.
        """
        categories = obj.categories.all()

        if not categories:
            # No categories defined, use base ticket price
            return {"min": obj.ticket_price, "max": obj.ticket_price}

        available_prices = []

        for category in categories:
            # Skip sold out categories
            if category.has_quota and category.tickets_bought >= category.quota:
                continue

            # Calculate actual price after discount
            if category.discount == 0:
                actual_price = obj.ticket_price
            else:
                discount_amount = (obj.ticket_price * category.discount) // 10000
                actual_price = obj.ticket_price - discount_amount

            available_prices.append(actual_price)

        if not available_prices:
            # All categories sold out
            return {"min": None, "max": None}

        return {"min": min(available_prices), "max": max(available_prices)}


class TicketCategorySerializer(serializers.ModelSerializer[TicketCategory]):
    class Meta:
        model = TicketCategory
        fields = (
            "category_id",
            "name",
            "discount",
            "quota",
            "has_quota",
            "tickets_bought",
        )
        read_only_fields = fields


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            name="Default",
            response_only=True,
        ),
    ]
)
class StaffEventSerializer(EventSerializer):
    cancel_date_timestamp = serializers.SerializerMethodField()
    tickets_required_until_cancel = serializers.SerializerMethodField(allow_null=False)

    class Meta:
        model = EventSerializer.Meta.model
        fields = (
            *EventSerializer.Meta.fields,
            "tickets_required_until_cancel",
            "cancel_date_timestamp",
        )

    def to_representation(self, obj: Event) -> dict[str, Any]:
        data = super().to_representation(obj)
        data["tickets_bought"] = obj.tickets_bought
        return data

    def get_tickets_required_until_cancel(self, obj: Event) -> int:
        return max(obj.tickets_bought - obj.place.min_tickets, 0)

    def get_cancel_date_timestamp(self, obj: Event) -> int:
        return int(
            (obj.start_date - timedelta(days=obj.place.days_before_cancel)).timestamp()
        )


class CreatorEventSerializer(StaffEventSerializer):
    tickets_bought = serializers.IntegerField(allow_null=True)
    cancel_date_timestamp = serializers.SerializerMethodField(allow_null=True)
    tickets_required_until_cancel = serializers.SerializerMethodField(allow_null=True)

    class Meta:
        model = StaffEventSerializer.Meta.model
        fields = StaffEventSerializer.Meta.fields

    def to_representation(self, obj: Event) -> dict[str, Any]:
        data = super().to_representation(obj)
        if self.should_provide_sensitive(obj):
            return data
        # Keep only public fields
        for field in self.Meta.fields:
            if field in EventSerializer.Meta.fields:
                continue
            data[field] = None

        return data

    def should_provide_sensitive(self, obj: Event) -> bool:
        user = self.context["request"].user
        if isinstance(user, User):
            return obj.creator.address == user.address
        return False


@dataclass
class EventMetaData:
    cover: "File[bytes]"
    title: str
    website: str
    description: str
    socials_cid: str


class UploadEventMetaToIpfsSerializer(serializers.Serializer[EventMetaData]):
    cover = serializers.FileField()
    title = serializers.CharField()
    description = serializers.CharField()
    website = serializers.CharField()
    socials_cid = serializers.CharField()

    def create(self, validated_data: dict[str, Any]) -> EventMetaData:
        return EventMetaData(**validated_data)


@dataclass
class PlaceMetaData:
    title: str
    geometry: dict[str, Any]
    event_deposit_size: int = 0


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            name="Example Point",
            value={
                "title": "Example Venue",
                "geometry": {
                    "type": "Point",
                    "coordinates": {"lat": 50.789012, "lng": 10.123456},
                },
            },
            request_only=True,
        ),
        OpenApiExample(
            name="Example Polygon",
            value={
                "title": "Example Area",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        {"lat": -8.2999846, "lng": 115.0890964},
                        {"lat": -8.3006452, "lng": 115.0893669},
                        {"lat": -8.3001425, "lng": 115.0900825},
                    ],
                },
            },
            request_only=True,
        ),
    ]
)
class UploadPlaceMetaToIpfsSerializer(serializers.Serializer[PlaceMetaData]):
    title = serializers.CharField(help_text="Title of the event place")
    geometry = serializers.JSONField(help_text="Geometry with type and coordinates")
    event_deposit_size = serializers.IntegerField(
        default=0,
        min_value=0,
        help_text="Suggested deposit size for events at this place (in USDT)",
    )

    def create(self, validated_data: dict[str, Any]) -> PlaceMetaData:
        return PlaceMetaData(**validated_data)


@dataclass
class TicketMetaData:
    socials: UserSocials
    eventid: int
    eventtitle: None | str
    eventcover: None | str


class UploadTicketMetaToIpfsSerializer(serializers.Serializer[TicketMetaData]):
    socials = UploadSocialsSerializer()
    eventid = serializers.IntegerField()
    eventtitle = serializers.CharField(default=None)
    eventcover = serializers.CharField(default=None)

    def create(self, validated_data: dict[str, Any]) -> TicketMetaData:
        return TicketMetaData(**validated_data)


@dataclass
class OrderTicketItem:
    category_id: int
    category_name: str
    price: int
    quantity: int


@dataclass
class OrderMetaData:
    event_id: int
    buyer_address: str
    socials: dict[str, Any]
    tickets: list[OrderTicketItem]
    total_tickets: int
    total_price: int
    currency: str
    referral_data: str


class OrderTicketItemSerializer(serializers.Serializer[OrderTicketItem]):
    category_id = serializers.IntegerField()
    category_name = serializers.CharField()
    price = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class UploadOrderMetaToIpfsSerializer(serializers.Serializer[OrderMetaData]):
    event_id = serializers.IntegerField()
    buyer_address = serializers.CharField()
    socials = UploadSocialsSerializer()
    tickets = OrderTicketItemSerializer(many=True)
    total_tickets = serializers.IntegerField(min_value=1)
    total_price = serializers.IntegerField(min_value=0)
    currency = serializers.CharField(default="USDC")
    referral_data = serializers.CharField(default="", allow_blank=True)

    def create(self, validated_data: dict[str, Any]) -> OrderMetaData:
        tickets_data = validated_data.pop("tickets", [])
        tickets = [OrderTicketItem(**t) for t in tickets_data]
        return OrderMetaData(tickets=tickets, **validated_data)


class DistributionProfileSerializer(serializers.ModelSerializer[DistributionProfile]):
    """Serializer for DistributionProfile model."""

    owner_address = serializers.SerializerMethodField()

    class Meta:
        model = DistributionProfile
        fields = (
            "id",
            "owner",
            "owner_address",
            "recipients",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "owner_address",
            "recipients",
            "is_active",
            "created_at",
            "updated_at",
        )

    @extend_schema_field(serializers.CharField())
    def get_owner_address(self, obj: DistributionProfile) -> str:
        return obj.owner.address
