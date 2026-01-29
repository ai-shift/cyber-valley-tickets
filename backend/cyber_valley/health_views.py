from typing import TypedDict

from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from web3 import Web3


class HealthServices(TypedDict):
    database: str
    blockchain: str


class HealthStatus(TypedDict):
    status: str
    services: HealthServices


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(_request: Request) -> Response:
    health_status: HealthStatus = {
        "status": "alive",
        "services": {
            "database": "unhealthy",
            "blockchain": "unhealthy",
        },
    }

    # Check Database
    try:
        db_conn = connections["default"]
        db_conn.cursor()
        health_status["services"]["database"] = "healthy"
    except OperationalError:
        health_status["status"] = "unhealthy"
        health_status["services"]["database"] = "unhealthy"

    # Check Blockchain
    try:
        w3 = Web3(Web3.HTTPProvider(settings.HTTP_ETH_NODE_HOST))
        if w3.is_connected():
            health_status["services"]["blockchain"] = "healthy"
        else:
            health_status["status"] = "unhealthy"
            health_status["services"]["blockchain"] = "unhealthy"
    except Exception:
        health_status["status"] = "unhealthy"
        health_status["services"]["blockchain"] = "unhealthy"

    return Response(
        health_status, status=200 if health_status["status"] == "alive" else 503
    )
