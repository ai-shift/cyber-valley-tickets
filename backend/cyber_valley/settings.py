# ruff: noqa: E501
"""
Django settings for cyber_valley project.

Generated by 'django-admin startproject' using Django 5.2.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

import logging
import os
from datetime import timedelta
from pathlib import Path
from typing import Final, Literal, TypedDict

import pyshen

pyshen.logging.setup()
log = logging.getLogger(__name__)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = bool(os.environ.get("DJANGO_DEBUG", None))
if DEBUG:
    log.warning("!!! RUNNING IN DEBUG MODE !!!")

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

ALLOWED_HOSTS = ["localhost"] if DEBUG else ["cvland-tickets.aishift.co"]


CORS_ALLOWED_ORIGINS = (
    (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )
    if DEBUG
    else ("https://cvland-tickets.aishift.co",)
)
CORS_ALLOW_CREDENTIALS = True

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_standardized_errors",
    "corsheaders",
    "drf_spectacular",
    "cyber_valley.events",
    "cyber_valley.web3_auth",
    "cyber_valley.users",
    "cyber_valley.notifications",
    "cyber_valley.scripts",
    "cyber_valley.indexer",
    "cyber_valley.event_reaper",
]

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_standardized_errors.openapi.AutoSchema",
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "cyber_valley.web3_auth.authenticate.CookieJWTAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
    ),
    "DEFAULT_PARSER_CLASSES": (
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
    ),
    "EXCEPTION_HANDLER": "drf_standardized_errors.handler.exception_handler",
    "JSON_UNDERSCOREIZE": {
        "ignore_keys": ("issued_at", "expiration_time", "invalid_before", "chain_id"),
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Cyber Valley Tickets API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
        "displayOperationId": True,
    },
    "CAMELIZE_NAMES": False,
    "POSTPROCESSING_HOOKS": [
        "drf_standardized_errors.openapi_hooks.postprocess_schema_enums",
        "drf_spectacular.contrib.djangorestframework_camel_case.camelize_serializer_fields",
    ],
    "ENUM_NAME_OVERRIDES": {
        "ValidationErrorEnum": "drf_standardized_errors.openapi_serializers.ValidationErrorEnum.choices",
        "ClientErrorEnum": "drf_standardized_errors.openapi_serializers.ClientErrorEnum.choices",
        "ServerErrorEnum": "drf_standardized_errors.openapi_serializers.ServerErrorEnum.choices",
        "ErrorCode401Enum": "drf_standardized_errors.openapi_serializers.ErrorCode401Enum.choices",
        "ErrorCode403Enum": "drf_standardized_errors.openapi_serializers.ErrorCode403Enum.choices",
        "ErrorCode404Enum": "drf_standardized_errors.openapi_serializers.ErrorCode404Enum.choices",
        "ErrorCode405Enum": "drf_standardized_errors.openapi_serializers.ErrorCode405Enum.choices",
        "ErrorCode406Enum": "drf_standardized_errors.openapi_serializers.ErrorCode406Enum.choices",
        "ErrorCode415Enum": "drf_standardized_errors.openapi_serializers.ErrorCode415Enum.choices",
        "ErrorCode429Enum": "drf_standardized_errors.openapi_serializers.ErrorCode429Enum.choices",
        "ErrorCode500Enum": "drf_standardized_errors.openapi_serializers.ErrorCode500Enum.choices",
    },
    "COMPONENT_SPLIT_REQUEST": True,
}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "djangorestframework_camel_case.middleware.CamelCaseMiddleWare",
]

ROOT_URLCONF = "cyber_valley.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "cyber_valley.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
if DEBUG:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["DB_NAME"],
            "USER": os.environ["DB_USER"],
            "PASSWORD": os.environ["DB_PASSWORD"],
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": int(os.environ.get("DB_PORT", "5432")),
        }
    }

AUTH_USER_MODEL = "users.CyberValleyUser"


class SimpleJWTSettingsDict(TypedDict):
    USER_ID_FIELD: str
    ACCESS_TOKEN_LIFETIME: timedelta
    REFRESH_TOKEN_LIFETIME: timedelta
    AUTH_COOKIE: str
    REFRESH_COOKIE: str
    AUTH_COOKIE_DOMAIN: str | None
    AUTH_COOKIE_SECURE: bool
    AUTH_COOKIE_HTTP_ONLY: bool
    AUTH_COOKIE_PATH: str
    AUTH_COOKIE_SAMESITE: Literal["Lax", "Strict", "None", False] | None


SIMPLE_JWT: Final[SimpleJWTSettingsDict] = {
    "USER_ID_FIELD": "address",
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "AUTH_COOKIE": "access_token",
    "REFRESH_COOKIE": "refresh_token",
    "AUTH_COOKIE_DOMAIN": None,
    "AUTH_COOKIE_SECURE": False,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "Lax",
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

EVENT_MODELS_BASE_PATH = BASE_DIR / "cyber_valley/indexer/service/events"
HTTP_ETH_NODE_HOST = os.environ["PUBLIC_HTTP_ETH_NODE_HOST"]
WS_ETH_NODE_HOST = os.environ["WS_ETH_NODE_HOST"]

DEFAULT_CHAIN_ID = 1337

# XXX: Order should match actual deployment flow
CONTRACTS_INFO: Final = (
    (
        BASE_DIR
        / "ethereum_artifacts/contracts/mocks/SimpleERC20Xylose.sol"
        / "SimpleERC20Xylose.json"
    ),
    (
        BASE_DIR
        / "ethereum_artifacts/contracts/CyberValleyEventTicket.sol/"
        / "CyberValleyEventTicket.json"
    ),
    (
        BASE_DIR
        / "ethereum_artifacts/contracts/CyberValleyEventManager.sol"
        / "CyberValleyEventManager.json"
    ),
)

IPFS_DATA_PATH = Path(os.environ["IPFS_DATA"])
IPFS_PUBLIC_HOST = os.environ["IPFS_PUBLIC_HOST"]

ACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ["VALKEY_HOST"],
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}
