from rest_framework import permissions, viewsets

from .models import EventPlace
from .serializers import EventPlaceSerializer


class EventPlaceViewSet(viewsets.ModelViewSet[EventPlace]):
    """
    API endpoint that allows event places to be viewed
    """

    queryset = EventPlace.objects.all()
    serializer_class = EventPlaceSerializer
    permission_classes = (permissions.IsAuthenticated,)
