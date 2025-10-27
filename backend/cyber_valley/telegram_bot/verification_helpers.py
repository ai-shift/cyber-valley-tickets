from typing import Literal

from django.conf import settings
from typing_extensions import assert_never


def create_verification_caption(
    metadata_cid: str,
    verification_type: str,
    status: Literal["pending", "approved", "declined"] = "pending",
) -> str:
    """Create caption for verification request message based on status."""
    ipfs_url = f"{settings.IPFS_PUBLIC_HOST}/ipfs/{metadata_cid}"

    match status:
        case "pending":
            header = "🔔 New Shaman Verification Request"
        case "approved":
            header = "✅ Verification request has been approved"
        case "declined":
            header = "❌ Verification request has been declined"
        case _ as unreachable:
            assert_never(unreachable)

    return f"{header}\n\nType: {verification_type}\nIPFS Metadata: {ipfs_url}"
