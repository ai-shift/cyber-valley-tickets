import os
from typing import Final

TELEGRAM_BOT_API_TOKEN_ENV: Final = "TELEGRAM_BOT_API_TOKEN"  # noqa: S105


def require_telegram_bot_token() -> str:
    token = os.environ.get(TELEGRAM_BOT_API_TOKEN_ENV)
    if not token:
        raise RuntimeError(f"{TELEGRAM_BOT_API_TOKEN_ENV} is not set")
    return token
