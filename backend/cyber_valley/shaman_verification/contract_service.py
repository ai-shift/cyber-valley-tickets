import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any

from django.conf import settings
from eth_account import Account
from eth_account.signers.local import LocalAccount
from eth_typing import ChecksumAddress, HexAddress, HexStr
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder

logger = logging.getLogger(__name__)

EVENT_MANAGER_ADDRESS = ChecksumAddress(
    HexAddress(HexStr(os.environ["PUBLIC_EVENT_MANAGER_ADDRESS"]))
)
EVENT_MANAGER_ABI = json.loads(settings.CONTRACTS_INFO[2].read_text())["abi"]
BACKEND_PRIVATE_KEY = os.environ["BACKEND_EOA_PRIVATE_KEY"]


@dataclass
class ContractService:
    w3: Web3 = field(init=False)
    account: LocalAccount = field(init=False)
    contract: Any = field(init=False)

    def __post_init__(self) -> None:
        self.w3 = Web3(Web3.HTTPProvider(settings.HTTP_ETH_NODE_HOST))
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to Ethereum node")

        self.account = Account.from_key(BACKEND_PRIVATE_KEY)
        self.w3.eth.default_account = self.account.address
        self.w3.middleware_onion.inject(
            SignAndSendRawMiddlewareBuilder.build(self.account), layer=0
        )

        self.contract = self.w3.eth.contract(
            abi=EVENT_MANAGER_ABI, address=EVENT_MANAGER_ADDRESS
        )
        logger.info("ContractService initialized with EOA %s", self.account.address)

    def check_backend_has_role(self) -> bool:
        """Check if backend EOA has BACKEND_ROLE"""
        try:
            backend_role = self.contract.functions.BACKEND_ROLE().call()
            has_role: bool = self.contract.functions.hasRole(
                backend_role, self.account.address
            ).call()
        except Exception:
            logger.exception("Failed to check BACKEND_ROLE")
            raise
        else:
            return has_role

    def grant_verified_shaman_role(self, address: str) -> tuple[bool, str | None]:
        """
        Grant VERIFIED_SHAMAN_ROLE to an address.

        Returns:
            tuple[bool, str | None]: (success, error_message)
        """
        try:
            verified_shaman_role = self.contract.functions.VERIFIED_SHAMAN_ROLE().call()
            tx = self.contract.functions.grantRole(verified_shaman_role, address)
            receipt = tx.transact()
            tx_hash = receipt.hex() if hasattr(receipt, "hex") else str(receipt)
            logger.info(
                "Successfully granted VERIFIED_SHAMAN_ROLE to %s. TX: %s",
                address,
                tx_hash,
            )
        except Exception as e:
            logger.exception("Failed to grant VERIFIED_SHAMAN_ROLE to %s", address)
            return False, str(e)
        else:
            return True, None
