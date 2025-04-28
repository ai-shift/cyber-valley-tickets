from rest_framework import permissions, viewsets

from .models import Event, EventPlace
from .serializers import EventPlaceSerializer, EventSerializer


class EventPlaceViewSet(viewsets.ReadOnlyModelViewSet[EventPlace]):
    """
    API endpoint that allows event places to be viewed
    """

    queryset = EventPlace.objects.all()
    serializer_class = EventPlaceSerializer


class EventViewSet(viewsets.ReadOnlyModelViewSet[Event]):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    http_method_names = ['get']
