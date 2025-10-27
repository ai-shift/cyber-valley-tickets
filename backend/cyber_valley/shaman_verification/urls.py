from django.urls import path

from .views import verify_company, verify_individual

urlpatterns = [
    path("individual", verify_individual, name="shaman-verify-individual"),
    path("company", verify_company, name="shaman-verify-company"),
]
