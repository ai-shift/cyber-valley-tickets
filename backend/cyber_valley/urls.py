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
    DistributionProfileViewSet,
    EventPlaceViewSet,
    EventViewSet,
    event_categories,
    event_status,
    lifetime_revenue,
    ticket_info,
    ticket_nonce,
    total_revenue,
    upload_event_meta_to_ipfs,
    upload_order_meta_to_ipfs,
    upload_place_meta_to_ipfs,
    verification_stats,
    verify_ticket,
)
from .geodata.views import GeodataViewSet
from .health.views import health_check
from .notifications.views import NotificationViewSet
from .siwe.views import siwe_payload, siwe_status, siwe_verify
from .users.views import (
    CurrentUserViewSet,
    get_user_profile,
    get_user_socials,
    save_user_socials,
    upload_user_socials_to_ipfs,
)

router = routers.DefaultRouter()
router.register(r"places", EventPlaceViewSet)
router.register(r"events", EventViewSet)
router.register(
    r"distribution-profiles",
    DistributionProfileViewSet,
    basename="distribution-profile",
)
router.register(r"notifications", NotificationViewSet, basename="Notification")
router.register(r"users", CurrentUserViewSet, basename="users")
router.register(r"geodata", GeodataViewSet, basename="geodata")

urlpatterns = [
    path("", SpectacularSwaggerView.as_view(), name="swagger"),
    path("api/", include(router.urls)),
    path(
        "api/events/<int:event_id>/categories",
        event_categories,
        name="event_categories",
    ),
    path("api/events/<int:event_id>/status", event_status, name="event_status"),
    path(
        "api/events/<int:event_id>/lifetime_revenue",
        lifetime_revenue,
        name="lifetime_revenue",
    ),
    path("api/events/total_revenue", total_revenue, name="total_revenue"),
    path(
        "api/events/verification-stats", verification_stats, name="verification_stats"
    ),
    path(
        "api/events/<int:event_id>/tickets/<int:ticket_id>",
        ticket_info,
        name="ticket_info",
    ),
    path(
        "api/events/<int:event_id>/tickets/<int:ticket_id>/nonce",
        ticket_nonce,
        name="ticket-nonce",
    ),
    path(
        "api/events/<int:event_id>/tickets/<int:ticket_id>/nonce/<str:nonce>",
        verify_ticket,
        name="verify-ticket",
    ),
    path("api/ipfs/events/meta", upload_event_meta_to_ipfs, name="ipfs-events"),
    path("api/ipfs/places/meta", upload_place_meta_to_ipfs, name="ipfs-events"),
    path("api/ipfs/users/socials", upload_user_socials_to_ipfs, name="ipfs-socials"),
    path("api/ipfs/orders/meta", upload_order_meta_to_ipfs, name="ipfs-orders"),
    path("api/users/socials", save_user_socials, name="save-socials"),
    path("api/users/<str:address>/socials", get_user_socials, name="get-user-socials"),
    path("api/users/<str:address>/profile", get_user_profile, name="get-user-profile"),
    # Stateless SIWE proof tokens (used for ticket QR + staff verification).
    path("api/siwe/payload", siwe_payload, name="siwe-payload"),
    path("api/siwe/verify", siwe_verify, name="siwe-verify"),
    path("api/siwe/status", siwe_status, name="siwe-status"),
    path("api/auth/custom/", include("cyber_valley.custom_auth.urls")),
    path("api/shaman/verify/", include("cyber_valley.shaman_verification.urls")),
    path("api/telegram/", include("cyber_valley.telegram_bot.urls")),
    path("api/health/", health_check, name="health_check"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]
