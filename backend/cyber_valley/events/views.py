from drf_spectacular.utils import (
    PolymorphicProxySerializer,
    extend_schema,
    extend_schema_view,
)
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Event, EventPlace
from .serializers import EventPlaceSerializer, EventSerializer, StaffEventSerializer


class EventPlaceViewSet(viewsets.ReadOnlyModelViewSet[EventPlace]):
    """
    API endpoint that allows event places to be viewed
    """

    queryset = EventPlace.objects.all()
    serializer_class = EventPlaceSerializer


@extend_schema_view(
    list=extend_schema(
        description="Available events in the syste",
        responses=PolymorphicProxySerializer(
            component_name="RoleBasedEvent",
            serializers=[EventSerializer, StaffEventSerializer],
            resource_type_field_name=None,
        ),
    )
)
class EventViewSet(viewsets.ReadOnlyModelViewSet[Event]):
    queryset = Event.objects.all()
    serializer_class = StaffEventSerializer
    http_method_names = ("get",)
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self) -> type[EventSerializer]:
        if self.request.user.is_staff:
            return StaffEventSerializer

        return EventSerializer
