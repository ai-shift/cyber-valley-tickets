"""Tests for ContractService to verify role granting works correctly."""

import pytest
from web3 import Web3

from .contract_service import ContractService

# Test address
TEST_SHAMAN_ADDRESS = "0xA84036A18ecd8f4F3D21ca7f85BEcC033571b15e"


@pytest.fixture
def contract_service() -> ContractService:
    """Create a ContractService instance."""
    return ContractService()


@pytest.fixture
def checksum_address() -> str:
    """Convert test address to checksum format."""
    return Web3.to_checksum_address(TEST_SHAMAN_ADDRESS)


def test_backend_has_role(contract_service: ContractService) -> None:
    """Test that backend EOA has BACKEND_ROLE."""
    has_role = contract_service.check_backend_has_role()
    assert has_role, "Backend EOA should have BACKEND_ROLE"


def test_grant_verified_shaman_role(
    contract_service: ContractService, checksum_address: str
) -> None:
    """Test granting VERIFIED_SHAMAN_ROLE to an address."""
    # First, ensure the address doesn't have the role
    verified_shaman_role = (
        contract_service.contract.functions.VERIFIED_SHAMAN_ROLE().call()
    )
    has_role_before = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()

    # Grant the role
    success, error = contract_service.grant_verified_shaman_role(checksum_address)
    assert success, f"Failed to grant role: {error}"

    # Verify the role was granted
    has_role_after = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()
    assert has_role_after, "Address should have VERIFIED_SHAMAN_ROLE after granting"

    # Clean up: revoke the role if it wasn't there before
    if not has_role_before:
        contract_service.revoke_verified_shaman_role(checksum_address)


def test_revoke_verified_shaman_role(
    contract_service: ContractService, checksum_address: str
) -> None:
    """Test revoking VERIFIED_SHAMAN_ROLE from an address."""
    verified_shaman_role = (
        contract_service.contract.functions.VERIFIED_SHAMAN_ROLE().call()
    )

    # First grant the role
    success, error = contract_service.grant_verified_shaman_role(checksum_address)
    assert success, f"Failed to grant role: {error}"

    # Verify it was granted
    has_role_before = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()
    assert has_role_before, "Address should have role before revoking"

    # Revoke the role
    success, error = contract_service.revoke_verified_shaman_role(checksum_address)
    assert success, f"Failed to revoke role: {error}"

    # Verify the role was revoked
    has_role_after = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()
    assert not has_role_after, (
        "Address should not have VERIFIED_SHAMAN_ROLE after revoking"
    )


def test_grant_and_revoke_cycle(
    contract_service: ContractService, checksum_address: str
) -> None:
    """Test a complete grant and revoke cycle."""
    verified_shaman_role = (
        contract_service.contract.functions.VERIFIED_SHAMAN_ROLE().call()
    )

    # Check initial state
    initial_has_role = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()

    # Grant the role
    success, error = contract_service.grant_verified_shaman_role(checksum_address)
    assert success, f"Failed to grant role: {error}"

    # Verify granted
    has_role = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()
    assert has_role, "Address should have role after granting"

    # Revoke the role
    success, error = contract_service.revoke_verified_shaman_role(checksum_address)
    assert success, f"Failed to revoke role: {error}"

    # Verify revoked
    has_role = contract_service.contract.functions.hasRole(
        verified_shaman_role, checksum_address
    ).call()
    assert not has_role, "Address should not have role after revoking"

    # Restore initial state if needed
    if initial_has_role:
        contract_service.grant_verified_shaman_role(checksum_address)
