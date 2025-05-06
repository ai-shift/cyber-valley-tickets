
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from .serializers import SIWEModel


def verify_signature(data: SIWEModel) -> bool:
    message_hash = encode_defunct(text=data.message)
    try:
        recovered_address = Account.recover_message(
            message_hash, signature=data.signature
        )
        recovered_address = Web3.to_checksum_address(recovered_address)
        if data.address.lower() == recovered_address.lower():
            return True
    except Exception as e:
        print(f"Signature verification error: {e}")
    return False
