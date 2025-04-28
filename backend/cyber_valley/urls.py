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

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .events import views
from .web3_auth.views import login

router = routers.DefaultRouter()
router.register(r"places", views.EventPlaceViewSet)
router.register(r"events", views.EventViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("admin/", admin.site.urls),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("schema/redoc", SpectacularRedocView.as_view(), name="redoc"),
    path("auth/web3/login/", login, name="web3_login"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
