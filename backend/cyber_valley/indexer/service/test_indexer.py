import json
import os
import subprocess
import threading
from collections.abc import Callable, Generator
from contextlib import AbstractContextManager, contextmanager
from functools import partial
from pathlib import Path
from typing import Final, Literal

import pytest
from eth_typing import ChecksumAddress
from hexbytes import HexBytes
from pytest_print import Printer
from web3 import Web3
from web3.contract import Contract
from web3.types import LogReceipt
from web3.utils.address import get_create_address

from . import indexer

ETHEREUM_DIR: Final = Path(__file__).parent.parent.parent.parent.parent / "ethereum"
ETH_NETWORK_HOST: Final = "localhost:8545"
CONTRACTS_INFO: Final = (
    (
        ETHEREUM_DIR
        / "artifacts/contracts/CyberValleyEventManager.sol"
        / "CyberValleyEventManager.json"
    ),
    (
        ETHEREUM_DIR
        / "artifacts/contracts/CyberValleyEventTicket.sol/"
        / "CyberValleyEventTicket.json"
    ),
)
"""
Contains contracts and their ABI in order of deployment
"""

ProcessStarter = Generator[None]


@pytest.fixture(autouse=True)
def run_hardhat_node(printer_session: Printer) -> ProcessStarter:
    printer_session("Starting hardha node")
    yield from _execute(
        "pnpm exec hardhat node",
        yield_after_line="Listening on ",
    )
    printer_session("Hardhat node terminated")


HardhatTestRunner = Callable[[str], AbstractContextManager[None]]


@pytest.fixture
def run_hardhat_test(printer_session: Printer) -> HardhatTestRunner:
    @contextmanager
    def inner(test_to_run: str) -> ProcessStarter:
        printer_session(f"Starting hardhat test of {test_to_run}")
        yield from _execute(
            f"pnpm exec hardhat --network localhost test --grep {test_to_run}",
            env={"DISABLE_BLOCKHAIN_RESTORE": "1"},
        )
        printer_session(f"Hardhat test finished of {test_to_run}")

    return inner


@pytest.fixture
def w3() -> Web3:
    w3 = Web3(Web3.HTTPProvider(f"http://{ETH_NETWORK_HOST}"))
    assert w3.is_connected()
    return w3


def _execute(
    command: str,
    *,
    yield_after_line: None | str = None,
    timeout: int = 5,
    env: None | dict[str, str] = None,
) -> ProcessStarter:
    proc = subprocess.Popen(  # noqa: S602
        command,
        cwd=ETHEREUM_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        text=True,
        env=os.environ.copy() | (env or {}),
    )

    if yield_after_line:
        t = threading.Thread(target=partial(_wait_for_line, proc, yield_after_line))
        t.start()
        t.join(timeout=timeout)
    else:
        proc.wait()

    yield
    proc.kill()

    outs, errs = proc.communicate(timeout=1)

    print("Output of", command)
    print(outs)
    print(errs)
    print("End of", command)


def _wait_for_line(proc: subprocess.Popen[str], return_after_line: str) -> None:
    assert proc.stdout
    while return_after_line not in proc.stdout.readline():
        pass


def _get_all_contracts(
    w3: Web3, *, from_block: int = 0, to_block: int | Literal["latest"] = "latest"
) -> list[type[Contract]]:
    contract_addresses: list[ChecksumAddress] = []
    for block_number in range(
        from_block, w3.eth.block_number if to_block == "latest" else to_block + 1
    ):
        block = w3.eth.get_block(block_number, full_transactions=True)
        transactions = block["transactions"]

        contract_addresses.extend(
            get_create_address(tx["from"], tx["nonce"])
            for tx in transactions
            if not isinstance(tx, HexBytes)
        )
    contracts: list[type[Contract]] = []
    for address in contract_addresses:
        deployed_bytecode = w3.eth.get_code(address).hex()
        for abi_path in CONTRACTS_INFO:
            meta_info = json.loads(abi_path.read_text())
            # Cut 0x out
            if meta_info["deployedBytecode"][2:] != deployed_bytecode:
                continue
            abi = meta_info["abi"]
            # Only unique ABIs are requried
            if abi in (contract.abi for contract in contracts):
                continue
            contracts.append(w3.eth.contract(abi=abi))
    assert len(contracts) == len(CONTRACTS_INFO)
    return contracts


def _get_logs(w3: Web3) -> list[LogReceipt]:
    return w3.eth.filter({"fromBlock": 0, "toBlock": "latest"}).get_all_entries()


def test_create_event(w3: Web3, run_hardhat_test: HardhatTestRunner) -> None:
    with run_hardhat_test("createEvent"):
        contracts = _get_all_contracts(w3)
        logs = _get_logs(w3)
        print(f"Got logs: {len(logs)}")
        processed = [indexer.parse_log(log, contracts) for log in logs]
        print(f"Processed logs: {processed}")
