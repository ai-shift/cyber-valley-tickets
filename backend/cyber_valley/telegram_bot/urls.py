from django.urls import path

from cyber_valley.telegram_bot.views import (
    create_link_token,
    telegram_schema,
    telegram_updates,
)

urlpatterns = [
    path("schema", telegram_schema, name="telegram-schema"),
    path("updates", telegram_updates, name="telegram-updates"),
    path("link-token", create_link_token, name="telegram-link-token"),
]
