from django.urls import path

from .views import send_sms, submit_application, verify_code

urlpatterns = [
    path("send-sms/", send_sms, name="send_sms"),
    path("verify-code/", verify_code, name="verify_code"),
    path("submit-application/", submit_application, name="submit_application"),
]
