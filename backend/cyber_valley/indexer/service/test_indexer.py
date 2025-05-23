import json
import os
import subprocess
import threading
from collections.abc import Callable, Generator
from contextlib import AbstractContextManager, contextmanager, suppress
from functools import partial
from typing import Any, Final

import pytest
from django.conf import settings
from hexbytes import HexBytes
from pydantic import BaseModel
from pytest_print import Printer
from web3 import Web3
from web3.contract import Contract
from web3.types import LogReceipt

from . import indexer
from .events import CyberValleyEventManager

ProcessStarter = Generator[None]

ETHEREUM_DIR: Final = settings.BASE_DIR.parent / "ethereum"


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
    w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))
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
                if log["topics"]
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
        "MASTER_ROLE": 16,
        "STAFF_ROLE": 8,
        "DEFAULT_ADMIN_ROLE": 16,
        "EVENT_MANAGER_ROLE": 8,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )
    assert all(event == expected for event in new_place_available_events)
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    assert len(events) == 0, events


def test_update_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("updateEventPlace")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 16,
        "STAFF_ROLE": 8,
        "DEFAULT_ADMIN_ROLE": 16,
        "EVENT_MANAGER_ROLE": 8,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 150,
            "minTickets": 20,
            "minPrice": 30,
            "minDays": 2,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [7, 2]
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
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
        "MASTER_ROLE": 20,
        "STAFF_ROLE": 10,
        "DEFAULT_ADMIN_ROLE": 20,
        "EVENT_MANAGER_ROLE": 10,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 2,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 30,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 5,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [7, 1, 1, 1]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- NewEventRequest
    new_event_request_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventRequest)
    ]
    expected = [
        {
            "id": 0,
            "creator": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "startDate": 1747872000,
            "daysAmount": 1,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
        {
            "id": 0,
            "creator": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "startDate": 1747872000,
            "daysAmount": 4,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [2, 3]
    for event in new_event_request_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_event_request_events)
    #  end-region   -- NewEventRequest

    #  begin-region -- EventStatusChanged
    event_status_changed_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventStatusChanged)
    ]
    expected = {
        CyberValleyEventManager.EventStatusChanged.model_validate(data): count
        for data, count in [({"eventId": 0, "status": 1}, 3)]
    }
    for event in event_status_changed_events:
        expected[event] -= 1
    assert sum(expected.values()) == 0
    _cleanup_asserted_events(events, event_status_changed_events)
    #  end-region   -- EventStatusChanged

    _cleanup_erc_events(events)

    assert len(events) == 0, events


def test_approve_event(events_factory: EventsFactory) -> None:
    events = events_factory("approveEvent")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 6,
        "STAFF_ROLE": 3,
        "DEFAULT_ADMIN_ROLE": 6,
        "EVENT_MANAGER_ROLE": 3,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [2]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- NewEventRequest
    new_event_request_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventRequest)
    ]
    expected = [
        {
            "id": 0,
            "creator": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "startDate": 1747872000,
            "daysAmount": 1,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        }
    ]
    expected_counts = [2]
    for event in new_event_request_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_event_request_events)
    #  end-region   -- NewEventRequest

    #  begin-region -- EventStatusChanged
    event_status_changed_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventStatusChanged)
    ]
    expected = [
        {"eventId": 0, "status": 1},
    ]
    expected_counts = [1]
    for event in event_status_changed_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, event_status_changed_events)
    #  end-region   -- EventStatusChanged

    _cleanup_erc_events(events)

    assert len(events) == 0, events


def test_decline_event(events_factory: EventsFactory) -> None:
    events = events_factory("declineEvent")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 8,
        "STAFF_ROLE": 4,
        "DEFAULT_ADMIN_ROLE": 8,
        "EVENT_MANAGER_ROLE": 4,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [2]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- NewEventRequest
    new_event_request_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventRequest)
    ]
    expected = [
        {
            "id": 0,
            "creator": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "startDate": 1747872000,
            "daysAmount": 1,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        }
    ]
    expected_counts = [2]
    for event in new_event_request_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_event_request_events)
    #  end-region   -- NewEventRequest

    #  begin-region -- EventStatusChanged
    event_status_changed_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventStatusChanged)
    ]
    expected = [
        {"eventId": 0, "status": 2},
    ]
    expected_counts = [2]
    for event in event_status_changed_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, event_status_changed_events)
    #  end-region   -- EventStatusChanged

    _cleanup_erc_events(events)

    assert len(events) == 0, events


def test_update_event(events_factory: EventsFactory) -> None:
    events = events_factory("updateEvent")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 18,
        "STAFF_ROLE": 9,
        "DEFAULT_ADMIN_ROLE": 18,
        "EVENT_MANAGER_ROLE": 9,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 150,
            "minTickets": 20,
            "minPrice": 30,
            "daysBeforeCancel": 1,
            "minDays": 2,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [6, 3]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )
    assert all(event == expected for event in event_place_updated_events)
    _cleanup_asserted_events(events, event_place_updated_events)
    #  end-region   -- EventPlaceUpdated

    _cleanup_erc_events(events)

    assert len(events) == 0, events


def test_buy_ticket(events_factory: EventsFactory) -> None:
    events = events_factory("buyTicket")
    assert len(events) == 0, events


def test_close_event(events_factory: EventsFactory) -> None:
    events = events_factory("closeEvent")

    #  begin-region -- RoleGranted
    role_to_count = {
        "MASTER_ROLE": 18,
        "STAFF_ROLE": 9,
        "DEFAULT_ADMIN_ROLE": 18,
        "EVENT_MANAGER_ROLE": 9,
    }
    for role, count in role_to_count.items():
        role_granted_events = [
            event
            for event in events
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [7]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- NewEventRequest
    new_event_request_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventRequest)
    ]
    expected = [
        {
            "id": 0,
            "creator": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "startDate": 1747872000,
            "daysAmount": 1,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        }
    ]
    expected_counts = [1]
    for event in new_event_request_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_event_request_events)
    #  end-region   -- NewEventRequest

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )
    assert all(event == expected for event in event_place_updated_events)
    _cleanup_asserted_events(events, event_place_updated_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- EventStatusChanged
    event_status_changed_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventStatusChanged)
    ]
    expected = [
        {"eventId": 0, "status": 1},
        {"eventId": 0, "status": 4},
    ]
    expected_counts = [1, 1]
    for event in event_status_changed_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, event_status_changed_events)
    #  end-region   -- EventStatusChanged

    _cleanup_erc_events(events)

    assert len(events) == 0, events


def test_cancel_event(events_factory: EventsFactory) -> None:
    events = events_factory("cancelEvent")

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
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- EventPlaceUpdated
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "daysBeforeCancel": 1,
            "minDays": 1,
            "available": True,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        },
    ]
    expected_counts = [6]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- NewEventRequest
    new_event_request_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventRequest)
    ]
    expected = [
        {
            "id": 0,
            "creator": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "eventPlaceId": 0,
            "ticketPrice": 20,
            "startDate": 1747872000,
            "daysAmount": 1,
            "digest": (
                "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            ),
            "hashFunction": 18,
            "size": 32,
        }
    ]
    expected_counts = [1]
    for event in new_event_request_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_event_request_events)
    #  end-region   -- NewEventRequest

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
            "daysBeforeCancel": 1,
            "available": True,
            "digest": HexBytes(
                bytes.fromhex(
                    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                )
            ),
            "hashFunction": 18,
            "size": 32,
        }
    )
    assert all(event == expected for event in event_place_updated_events)
    _cleanup_asserted_events(events, event_place_updated_events)
    #  end-region   -- EventPlaceUpdated

    #  begin-region -- EventStatusChanged
    event_status_changed_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventStatusChanged)
    ]
    expected = [
        {"eventId": 0, "status": 1},
    ]
    expected_counts = [1]
    for event in event_status_changed_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, event_status_changed_events)
    #  end-region   -- EventStatusChanged

    _cleanup_erc_events(events)

    assert len(events) == 0, events


def _get_all_contracts(w3: Web3) -> list[type[Contract]]:
    return [
        w3.eth.contract(abi=json.loads(info_path.read_text())["abi"])
        for info_path in settings.CONTRACTS_INFO
    ]


def _get_logs(w3: Web3) -> list[LogReceipt]:
    return w3.eth.filter({"fromBlock": 0, "toBlock": "latest"}).get_all_entries()


def _cleanup_asserted_events[T: BaseModel](
    events: list[BaseModel], asserted_events: list[T]
) -> None:
    for evt in asserted_events:
        events.remove(evt)


def _cleanup_erc_events[T: BaseModel](events: list[BaseModel]) -> None:
    """
    On each hardhat there are ERC20 or ERC721 events, which are
    out of the indexer scope, so this helper function removes them
    """
    _cleanup_asserted_events(
        events,
        [
            event
            for event in events
            if event.__class__.__name__ in ("Transfer", "Approval")
        ],
    )
