import sys

from django.apps import AppConfig

from cyber_valley.common.telegram import require_telegram_bot_token


class TelegramBotConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cyber_valley.telegram_bot"

    def ready(self) -> None:
        # Validate that the Telegram bot API token is configured.
        # Only validate when running the server or telegram bot, not for
        # management commands like migrate, makemigrations, etc.
        if len(sys.argv) > 1 and sys.argv[1] in ("runserver", "telegram_bot"):
            require_telegram_bot_token()
