from rest_framework import permissions, viewsets

from .models import Event, EventPlace
from .serializers import EventPlaceSerializer, EventSerializer


class EventPlaceViewSet(viewsets.ModelViewSet[EventPlace]):
    """
    API endpoint that allows event places to be viewed
    """

    queryset = EventPlace.objects.all()
    serializer_class = EventPlaceSerializer
    permission_classes = (permissions.AllowAny,)


class EventViewSet(viewsets.ModelViewSet[Event]):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = (permissions.AllowAny,)
