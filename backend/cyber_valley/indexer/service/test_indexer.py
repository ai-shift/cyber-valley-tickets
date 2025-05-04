import json
import os
import subprocess
import threading
from collections.abc import Callable, Generator
from contextlib import AbstractContextManager, contextmanager, suppress
from functools import partial
from typing import Any

import pytest
from django.conf import settings
from pydantic import BaseModel
from pytest_print import Printer
from web3 import Web3
from web3.contract import Contract
from web3.types import LogReceipt

from . import indexer
from .events import CyberValleyEventManager

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
    (settings.ETHEREUM_DIR / "cache/solidity-files-cache.json").unlink(missing_ok=True)
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
    w3 = Web3(Web3.HTTPProvider(f"http://{settings.ETH_NODE_HOST}"))
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
        cwd=settings.ETHEREUM_DIR,
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
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- NewEventPlaceAvailable
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventPlaceAvailable)
    ]
    match new_place_available_events:
        case [event]:
            assert (
                event
                == CyberValleyEventManager.NewEventPlaceAvailable.model_validate(
                    {
                        "eventPlaceId": 0,
                        "maxTickets": 100,
                        "minTickets": 50,
                        "minPrice": 20,
                        "minDays": 1,
                    }
                )
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
            if isinstance(event, CyberValleyEventManager.RoleGranted)
            and event.role == role
        ]
        assert len(role_granted_events) == count
        _cleanup_asserted_events(events, role_granted_events)
    #  end-region   -- RoleGranted

    #  begin-region -- NewEventPlaceAvailable
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventPlaceAvailable)
    ]
    expected = CyberValleyEventManager.NewEventPlaceAvailable.model_validate(
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
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
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
        "MASTER_ROLE": 22,
        "STAFF_ROLE": 11,
        "DEFAULT_ADMIN_ROLE": 22,
        "EVENT_MANAGER_ROLE": 11,
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

    #  begin-region -- NewEventPlaceAvailable
    new_place_available_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventPlaceAvailable)
    ]
    expected = [
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 1,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 20,
            "minDays": 2,
        },
        {
            "eventPlaceId": 0,
            "maxTickets": 100,
            "minTickets": 50,
            "minPrice": 30,
            "minDays": 1,
        },
    ]
    expected_counts = [9, 1, 1]
    assert len(expected) == len(expected_counts)
    for event in new_place_available_events:
        expected_counts[expected.index(event.model_dump(by_alias=True))] -= 1
    assert sum(expected_counts) == 0
    _cleanup_asserted_events(events, new_place_available_events)
    #  end-region   -- NewEventPlaceAvailable

    #  begin-region -- EventPlaceUpdated
    event_place_updated_events = [
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.EventPlaceUpdated)
    ]
    expected = CyberValleyEventManager.EventPlaceUpdated.model_validate(
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
        event
        for event in events
        if isinstance(event, CyberValleyEventManager.NewEventRequest)
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


def _cleanup_erc_events[T: BaseModel](
    events: list[BaseModel]
) -> None:
    _cleanup_asserted_events(
        events,
        [
            event
            for event in events
            if event.__class__.__name__ in ("Transfer", "Approval")
        ],
    )
