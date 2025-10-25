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

from cyber_valley.users.models import CyberValleyUser as UserType
from cyber_valley.users.models import UserSocials
from cyber_valley.users.serializers import UploadSocialsSerializer

from .models import Event, EventPlace

User = get_user_model()


@extend_schema_field(
    {
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": ["Point"]},
            "coordinates": {
                "type": "array",
                "items": {"type": "number"},
                "minItems": 2,
                "maxItems": 2,
            },
        },
        "required": ["type", "coordinates"],
    }
)
class GeoJSONPointField(serializers.JSONField):
    """Custom field for GeoJSON Point geometry with proper OpenAPI schema."""



class EventPlaceSerializer(serializers.ModelSerializer[EventPlace]):
    is_used = serializers.SerializerMethodField()
    geometry = GeoJSONPointField(read_only=True)

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
        return UploadSocialsSerializer(last_social).data

    class Meta:
        model = User
        fields = ("address", "socials")


class AttendeeSerializer(CreatorSerializer):
    pass


class EventSerializer(serializers.ModelSerializer[Event]):
    place = EventPlaceSerializer(required=True)
    creator = CreatorSerializer(required=True)
    start_date_timestamp = serializers.SerializerMethodField()
    attendees = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "creator",
            "status",
            "title",
            "description",
            "place",
            "ticket_price",
            "days_amount",
            "image_url",
            "website",
            "start_date_timestamp",
            "tickets_bought",
            "attendees",
        )

    def get_start_date_timestamp(self, obj: Event) -> int:
        return int(obj.start_date.timestamp())

    @extend_schema_field(serializers.ListSerializer(child=AttendeeSerializer()))
    def get_attendees(self, obj: Event) -> list[dict[str, Any]]:
        return [AttendeeSerializer(ticket.owner).data for ticket in obj.tickets.all()]


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


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            name="Example Event Place",
            value={
                "title": "Example Venue",
                "geometry": {"type": "Point", "coordinates": [10.123456, 50.789012]},
            },
            request_only=True,
        ),
    ]
)
class UploadPlaceMetaToIpfsSerializer(serializers.Serializer[PlaceMetaData]):
    title = serializers.CharField(help_text="Title of the event place")
    geometry = GeoJSONPointField()

    def validate_geometry(self, value: dict[str, Any]) -> dict[str, Any]:
        """Validate GeoJSON Point geometry structure and coordinate ranges."""
        if not isinstance(value, dict):
            msg = "Geometry must be a JSON object"  # type: ignore[unreachable]
            raise serializers.ValidationError(msg)

        # Validate GeoJSON structure
        if "type" not in value:
            msg = "Geometry must have a 'type' field"
            raise serializers.ValidationError(msg)

        if "coordinates" not in value:
            msg = "Geometry must have a 'coordinates' field"
            raise serializers.ValidationError(msg)

        geom_type = value.get("type")
        coordinates = value.get("coordinates")

        # Support only Point type
        if geom_type != "Point":
            msg = "Geometry type must be 'Point'"
            raise serializers.ValidationError(msg)

        # Validate coordinates
        coord_pair_length = 2
        if not isinstance(coordinates, list) or len(coordinates) != coord_pair_length:
            msg = "Point coordinates must be [longitude, latitude]"
            raise serializers.ValidationError(msg)
        self._validate_coordinate_pair(coordinates)

        return value

    def _validate_coordinate_pair(self, coord: Any) -> None:
        """Validate a single [longitude, latitude] pair."""
        coord_pair_length = 2
        if not isinstance(coord, list) or len(coord) != coord_pair_length:
            msg = "Each coordinate must be [longitude, latitude]"
            raise serializers.ValidationError(msg)

        lng, lat = coord
        if not isinstance(lng, int | float) or not isinstance(lat, int | float):
            msg = "Coordinates must be numeric values"
            raise serializers.ValidationError(msg)

        # Validate ranges: longitude [-180, 180], latitude [-90, 90]
        min_lng, max_lng = -180, 180
        min_lat, max_lat = -90, 90
        if not min_lng <= lng <= max_lng:
            msg = f"Longitude must be between {min_lng} and {max_lng}, got {lng}"
            raise serializers.ValidationError(msg)

        if not min_lat <= lat <= max_lat:
            msg = f"Latitude must be between {min_lat} and {max_lat}, got {lat}"
            raise serializers.ValidationError(msg)

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
