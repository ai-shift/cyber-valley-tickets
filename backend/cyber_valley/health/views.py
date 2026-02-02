import logging
from datetime import UTC, datetime
from typing import TypedDict

from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.views import View

from cyber_valley.shaman_verification.contract_service import ContractService

logger = logging.getLogger(__name__)


class HealthStatus(TypedDict):
    status: str
    timestamp: str
    services: dict[str, dict[str, str | bool]]


class HealthCheckView(View):
    """Health check endpoint for monitoring service availability."""

    def get(self, _request: object) -> JsonResponse:
        """Return health status of all services."""
        services: dict[str, dict[str, str | bool]] = {
            "database": self._check_database(),
            "blockchain": self._check_blockchain(),
        }

        # Overall status is "alive" only if all services are healthy
        all_healthy = all(
            service.get("healthy", False) for service in services.values()
        )
        status = "alive" if all_healthy else "degraded"

        health_data: HealthStatus = {
            "status": status,
            "timestamp": datetime.now(UTC).isoformat(),
            "services": services,
        }

        # Return 503 if degraded, 200 if healthy
        status_code = 200 if all_healthy else 503
        return JsonResponse(health_data, status=status_code)

    def _check_database(self) -> dict[str, str | bool]:
        """Check database connectivity."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    return {
                        "healthy": True,
                        "status": "connected",
                    }
                return {
                    "healthy": False,
                    "status": "unexpected_response",
                }
        except DatabaseError:
            logger.exception("Database health check failed")
            return {
                "healthy": False,
                "status": "error",
            }

    def _check_blockchain(self) -> dict[str, str | bool]:
        """Check blockchain connection via contract service."""
        result: dict[str, str | bool]
        try:
            contract_service = ContractService()
            # Try to get the latest block number - this validates connection
            latest_block = contract_service.w3.eth.block_number
            # Check if we can connect to the provider
            if contract_service.w3.is_connected():
                result = {
                    "healthy": True,
                    "status": "connected",
                    "block_number": str(latest_block),
                }
            else:
                result = {
                    "healthy": False,
                    "status": "disconnected",
                }
        except Exception:
            logger.exception("Blockchain health check failed")
            result = {
                "healthy": False,
                "status": "error",
            }
        return result


health_check = HealthCheckView.as_view()
