from django.apps import AppConfig

from cyber_valley.common.telegram import require_telegram_bot_token


class TelegramBotConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cyber_valley.telegram_bot"

    def ready(self) -> None:
        # Validate that the Telegram bot API token is configured.
        # This will raise RuntimeError if the token is missing, causing
        # the backend to fail at startup.
        require_telegram_bot_token()
