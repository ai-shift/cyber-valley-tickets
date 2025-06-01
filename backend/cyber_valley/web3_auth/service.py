import logging

from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from .serializers import SIWEModel

log = logging.getLogger(__name__)


def verify_signature(data: SIWEModel) -> bool:
    message = create_login_message(data)
    log.info("Recreated message %s", message)
    message_hash = encode_defunct(text=message)
    try:
        recovered_address = Account.recover_message(
            message_hash, signature=data.signature
        )
        recovered_address = Web3.to_checksum_address(recovered_address)
        if data.address.lower() == recovered_address.lower():
            return True
        log.warning("Got different addresses %s != %s", data.address, recovered_address)
    except Exception:
        log.exception("Signature verification error")
    return False


def create_login_message(data: SIWEModel) -> str:
    """
    Create an EIP-4361 & CAIP-122 compliant message to sign based on the login payload.
    """

    type_field = "Ethereum"
    header = f"{data.domain} wants you to sign in with your {type_field} account:"
    prefix = f"{header}\n{data.address}"

    if data.statement:
        prefix = f"{prefix}\n\n{data.statement}\n"

    suffix_array = []

    if data.uri:
        uri_field = f"URI: {data.uri}"
        suffix_array.append(uri_field)

    version_field = f"Version: {data.version}"
    suffix_array.append(version_field)

    if data.chain_id:
        chain_field = f"Chain ID: {data.chain_id}"
        suffix_array.append(chain_field)

    nonce_field = f"Nonce: {data.nonce}"
    suffix_array.append(nonce_field)

    issued_at_field = f"Issued At: {data.issued_at}"
    suffix_array.append(issued_at_field)

    expiry_field = f"Expiration Time: {data.expiration_time}"
    suffix_array.append(expiry_field)

    if data.invalid_before:
        invalid_before_field = f"Not Before: {data.invalid_before}"
        suffix_array.append(invalid_before_field)

    if data.resources:
        resources_list = ["Resources:"] + [f"- {x}" for x in data.resources]
        suffix_array.append("\n".join(resources_list))

    suffix = "\n".join(suffix_array)

    return f"{prefix}\n{suffix}"
