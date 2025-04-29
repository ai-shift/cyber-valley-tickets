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
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .events.views import EventPlaceViewSet, EventViewSet
from .notifications.views import NotificationViewSet
from .users.views import CurrentUserViewSet
from .web3_auth.views import login

router = routers.DefaultRouter()
router.register(r"places", EventPlaceViewSet)
router.register(r"events", EventViewSet)
router.register(r"notifications", NotificationViewSet, basename="Notification")
router.register(r"users", CurrentUserViewSet, basename="users")

urlpatterns = [
    path("", SpectacularRedocView.as_view(), name="redoc"),
    path("api/", include(router.urls)),
    path("api/auth/web3/login/", login, name="web3_login"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]
