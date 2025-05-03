import json
import os
import subprocess
import threading
from collections.abc import Callable, Generator
from contextlib import AbstractContextManager, contextmanager, suppress
from functools import partial
from pathlib import Path
from typing import Any, Final, Literal

import pytest
from eth_typing import ChecksumAddress
from hexbytes import HexBytes
from pydantic import BaseModel
from pytest_print import Printer
from web3 import Web3
from web3.contract import Contract
from web3.types import LogReceipt
from web3.utils.address import get_create_address

from . import events_models, indexer

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

ProcessStarter = Generator[None]


@pytest.fixture(autouse=True)
def run_hardhat_node(printer_session: Printer) -> ProcessStarter:
    printer_session("Starting hardhat node")
    with suppress(subprocess.TimeoutExpired, ValueError):
        yield from _execute(
            "node_modules/.bin/hardhat node",
            yield_after_line="Started HTTP and WebSocket JSON-RPC server at ",
        )
    # This shit can't be killed from python. DIE ANYWAY
    subprocess.run("pkill -f node.*hardhat.*.js", shell=True, check=False)  # noqa: S602 S607
    # Seems like hardhat node caches some stuff which should be cleaned
    (ETHEREUM_DIR / "cache/solidity-files-cache.json").unlink(missing_ok=True)
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


EventsFactory = Callable[[str], list[BaseModel]]


@pytest.fixture
def events_factory(w3: Web3, run_hardhat_test: HardhatTestRunner) -> EventsFactory:
    def inner(test_to_run: str) -> list[BaseModel]:
        with run_hardhat_test(test_to_run):
            contracts = _get_all_contracts(w3)
            logs = _get_logs(w3)
            return [
                indexer.parse_log(log, contracts).unwrap()
                for log in logs
                if len(log["topics"]) == 1
            ]

    return inner


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


class MatchesAnyMixin:
    def __eq__(self, other: Any) -> bool:
        return any(isinstance(other, cls) for cls in self.__class__.__bases__)

    def __hash__(self) -> int:
        return hash(self.__class__.__name__)

    def __repr__(self) -> str:
        return self.__class__.__name__

    def __str__(self) -> str:
        return "*"


class MatchesAnyStr(MatchesAnyMixin, str):
    __slots__ = ()


class MatchesAnyInt(MatchesAnyMixin, int):
    pass


def test_create_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("createEventPlace")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 14,
        "STAFF_ROLE": 7,
        "DEFAULT_ADMIN_ROLE": 14,
        "EVENT_MANAGER_ROLE": 7,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, events_models.RoleGranted) and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- NewEventPlaceAvailable
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, events_models.NewEventPlaceAvailable)
    ]
    match new_place_available_events:
        case [event]:
            assert event == events_models.NewEventPlaceAvailable.model_validate(
                {
                    "eventPlaceId": 0,
                    "maxTickets": 100,
                    "minTickets": 50,
                    "minPrice": 20,
                    "minDays": 1,
                }
            )
        case unexpected:
            pytest.fail(f"Got unexpected NewEventPlaceAvailable events: {unexpected}")
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- NewEventPlaceAvailable

    assert len(events) == 0, events


def test_update_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("updateEventPlace")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 14,
        "STAFF_ROLE": 7,
        "DEFAULT_ADMIN_ROLE": 14,
        "EVENT_MANAGER_ROLE": 7,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, events_models.RoleGranted) and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- NewEventPlaceAvailable
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, events_models.NewEventPlaceAvailable)
    ]
    expected = events_models.NewEventPlaceAvailable.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
        }
    )
    assert all(event == expected for event in new_place_available_events)
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- NewEventPlaceAvailable

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event for event in events if isinstance(event, events_models.EventPlaceUpdated)
    ]
    expected = events_models.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 150,
            "minTickets": 20,
            "minPrice": 30,
            "minDays": 2,
        }
    )
    assert all(event == expected for event in event_place_updated_events)
    _cleanup_asserted_events(events, event_place_updated_events)
    #  end-region   -- EventPlaceUpdated

    assert len(events) == 0, events


def test_submit_event_request(events_factory: EventsFactory) -> None:
    events = events_factory("submitEventRequest")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 0,
        "STAFF_ROLE": 0,
        "DEFAULT_ADMIN_ROLE": 0,
        "EVENT_MANAGER_ROLE": 0,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, events_models.RoleGranted) and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- NewEventPlaceAvailable
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, events_models.NewEventPlaceAvailable)
    ]
    expected = {
        events_models.NewEventPlaceAvailable.model_validate(
            {
                "eventPlaceId": 0,
                "maxTickets": 100,
                "minTickets": 50,
                "minPrice": 20,
                "minDays": 1,
            }
        ): 9,
        events_models.NewEventPlaceAvailable.model_validate(
            {
                "eventPlaceId": 0,
                "maxTickets": 100,
                "minTickets": 50,
                "minPrice": 20,
                "minDays": 2,
            }
        ): 1,
        events_models.NewEventPlaceAvailable.model_validate(
            {
                "eventPlaceId": 0,
                "maxTickets": 100,
                "minTickets": 50,
                "minPrice": 30,
                "minDays": 1,
            }
        ): 1,
    }
    for event in new_place_available_events:
        expected[event] -= 1
    assert sum(expected.values()) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- NewEventPlaceAvailable

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event for event in events if isinstance(event, events_models.EventPlaceUpdated)
    ]
    expected = events_models.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 150,
            "minTickets": 20,
            "minPrice": 30,
            "minDays": 2,
        }
    )
    assert all(event == expected for event in event_place_updated_events)
    _cleanup_asserted_events(events, event_place_updated_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- NewEventRequest
    new_event_request_events = [
        event for event in events if isinstance(event, events_models.NewEventRequest)
    ]
    expected = [
        {
            "id": 0,
            "creator": MatchesAnyStr(),
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "cancelDate": MatchesAnyInt(),
            "startDate": MatchesAnyInt(),
            "daysAmount": 1,
        },
        {
            "id": 0,
            "creator": MatchesAnyStr(),
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "cancelDate": MatchesAnyInt(),
            "startDate": MatchesAnyInt(),
            "daysAmount": 4,
        },
    ]
    expected_counters = [2, 3]
    for event in new_event_request_events:
        expected_counters[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counters) == 0
    _cleanup_asserted_events(events, new_event_request_events)
    #  end-region   -- NewEventRequest

    #  begin-region -- EventStatusChanged
    event_status_changed_events = [
        event for event in events if isinstance(event, events_models.EventStatusChanged)
    ]
    expected = {
        events_models.EventStatusChanged.model_validate(data): count
        for data, count in [({"eventId": 0, "status": 1}, 3)]
    }
    for event in event_status_changed_events:
        expected[event] -= 1
    assert sum(expected.values()) == 0
    _cleanup_asserted_events(events, event_status_changed_events)
    #  end-region   -- EventStatusChanged

    assert len(events) == 0, events


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


def _cleanup_asserted_events[T: BaseModel](
    events: list[BaseModel], asserted_events: list[T]
) -> None:
    for evt in asserted_events:
        events.remove(evt)
