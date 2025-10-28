import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class ShamanVerificationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cyber_valley.shaman_verification"

    def ready(self) -> None:
        """Check that backend EOA has BACKEND_ROLE on startup"""
        import os
        import sys

        # Skip check if running migrations or in test mode
        if os.environ.get("RUN_MAIN") == "true" or "migrate" in sys.argv:
            return

        def check_role() -> None:
            from .contract_service import ContractService

            service = ContractService()
            if not service.check_backend_has_role():
                msg = (
                    f"Backend EOA {service.account.address} does not have "
                    "BACKEND_ROLE. Please grant the role using: "
                    "make grant-backend-role"
                )
                raise RuntimeError(msg)
            logger.info(
                "Backend EOA %s has BACKEND_ROLE - ready to manage shaman verification",
                service.account.address,
            )

        try:
            check_role()
        except Exception as e:
            logger.warning("Could not verify BACKEND_ROLE on startup: %s", e)
