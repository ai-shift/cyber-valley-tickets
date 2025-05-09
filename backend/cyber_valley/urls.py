"""
URL configuration for cyber_valley project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework import routers

from .events.views import (
    EventPlaceViewSet,
    EventViewSet,
    ticket_nonce,
    upload_event_meta_to_ipfs,
    upload_place_meta_to_ipfs,
    verify_ticket,
)
from .notifications.views import NotificationViewSet
from .users.views import CurrentUserViewSet, upload_user_socials_to_ipfs
from .web3_auth.views import login, logout, nonce, refresh, verify

router = routers.DefaultRouter()
router.register(r"places", EventPlaceViewSet)
router.register(r"events", EventViewSet)
router.register(r"notifications", NotificationViewSet, basename="Notification")
router.register(r"users", CurrentUserViewSet, basename="users")

urlpatterns = [
    path("", SpectacularSwaggerView.as_view(), name="swagger"),
    path("api/", include(router.urls)),
    path("api/events/tickets/nonce", ticket_nonce, name="ticket-nonce"),
    path("api/events/tickets/nonce/<str:nonce>", verify_ticket, name="verify-ticket"),
    path("api/ipfs/events/meta", upload_event_meta_to_ipfs, name="ipfs-events"),
    path("api/ipfs/places/meta", upload_place_meta_to_ipfs, name="ipfs-events"),
    path("api/ipfs/users/socials", upload_user_socials_to_ipfs, name="ipfs-socials"),
    path("api/auth/web3/login/", login, name="web3_login"),
    path("api/auth/web3/nonce/", nonce, name="web3_nonce"),
    path("api/auth/verify", verify, name="jwt_verify"),
    path("api/auth/refresh", refresh, name="jwt_refresh"),
    path("api/auth/logout", logout, name="jwt_logout"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]
