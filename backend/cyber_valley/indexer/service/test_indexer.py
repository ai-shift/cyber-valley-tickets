import json
import os
import subprocess
import threading
from collections.abc import Callable, Generator
from contextlib import AbstractContextManager, contextmanager, suppress
from functools import partial
from pathlib import Path
from typing import Any, Final

import pytest
from django.conf import settings
from pydantic import BaseModel
from pytest_print import Printer
from web3 import Web3
from web3.contract import Contract
from web3.types import LogReceipt

from . import indexer

ProcessStarter = Generator[None]

ETHEREUM_DIR: Final = settings.BASE_DIR.parent / "ethereum"
SNAPSHOTS_DIR: Final = Path(__file__).parent / "snapshots"


@pytest.fixture(autouse=True)
def run_hardhat_node(printer_session: Printer) -> ProcessStarter:
    printer_session("Starting hardhat node")
    with suppress(subprocess.TimeoutExpired, ValueError):
        yield from _execute(
            "node_modules/.bin/hardhat node",
            yield_after_line="Started HTTP and WebSocket JSON-RPC server at ",
            env={"HARDHAT_INITIAL_DATE": "2024-01-01T00:00:00Z"},
        )
    subprocess.run("pkill -f node.*hardhat.*.js", shell=True, check=False)
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
            env={
                "DISABLE_BLOCKHAIN_RESTORE": "1",
                "HARDHAT_INITIAL_DATE": "2024-01-01T00:00:00Z",
            },
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
            logs = _get_logs(w3)
            print(f"\n=== Total logs retrieved: {len(logs)} ===")
            events = []
            for idx, log in enumerate(logs):
                print(f"\n--- Processing log {idx + 1}/{len(logs)} ---")
                print(f"Address: {log.get('address')}")
                topics = [
                    t.hex() if hasattr(t, "hex") else t for t in log.get("topics", [])
                ]
                print(f"Topics: {topics}")
                try:
                    event = indexer.parse_log(log, _get_all_contracts(w3)).unwrap()
                    event_class = event.__class__
                    print(
                        f"✓ Successfully parsed as: "
                        f"{event_class.__module__}.{event_class.__name__}"
                    )
                    events.append(event)
                except Exception as e:
                    print(f"✗ Failed to parse: {type(e).__name__}: {e}")
            return events

    return inner


def _execute(
    command: str,
    *,
    yield_after_line: None | str = None,
    timeout: int = 5,
    env: None | dict[str, str] = None,
) -> ProcessStarter:
    proc = subprocess.Popen(
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


def _load_snapshot(test_name: str) -> dict[str, Any] | None:
    snapshot_file = SNAPSHOTS_DIR / f"{test_name}.json"
    if not snapshot_file.exists():
        return None
    return json.loads(snapshot_file.read_text())


def _get_all_contracts(w3: Web3) -> list[type[Contract]]:
    return [
        w3.eth.contract(abi=json.loads(info_path.read_text())["abi"])
        for info_path in settings.CONTRACTS_INFO
    ]


def _get_logs(w3: Web3) -> list[LogReceipt]:
    return w3.eth.filter({"fromBlock": 0, "toBlock": "latest"}).get_all_entries()


def _serialize_events(events: list[BaseModel]) -> dict[str, list[dict[str, Any]]]:
    events_by_type: dict[str, list[dict[str, Any]]] = {}
    for event in events:
        event_type = event.__class__.__name__
        full_type = f"{event.__class__.__module__.split('.')[-1]}.{event_type}"

        serialized = event.model_dump(by_alias=True)

        if full_type not in events_by_type:
            events_by_type[full_type] = []
        events_by_type[full_type].append(serialized)

    return events_by_type


def _assert_events_match_snapshot(
    test_name: str, events: list[BaseModel], snapshot_data: dict[str, Any] | None
) -> None:
    events_by_type = _serialize_events(events)
    new_snapshot_data = {
        "test_name": test_name,
        "events_count": len(events),
        "events_by_type": events_by_type,
    }

    if snapshot_data is None:
        new_snapshot_file = SNAPSHOTS_DIR / f"new_{test_name}.json"
        new_snapshot_file.write_text(
            json.dumps(new_snapshot_data, indent=2, sort_keys=True)
        )
        pytest.fail(
            f"Snapshot file not found!\n"
            f"New snapshot created at: {new_snapshot_file}\n"
            f"Review it and if correct:\n"
            f"  mv {new_snapshot_file} {SNAPSHOTS_DIR / f'{test_name}.json'}\n"
            f"Then re-run the test."
        )

    if events_by_type != snapshot_data["events_by_type"]:
        new_snapshot_file = SNAPSHOTS_DIR / f"new_{test_name}.json"
        new_snapshot_file.write_text(
            json.dumps(new_snapshot_data, indent=2, sort_keys=True)
        )

        pytest.fail(
            f"Events do not match snapshot!\n"
            f"New snapshot saved to: {new_snapshot_file}\n"
            f"Review the changes and if correct:\n"
            f"  mv {new_snapshot_file} {SNAPSHOTS_DIR / f'{test_name}.json'}\n"
            f"Or compare with: "
            f"diff {SNAPSHOTS_DIR / f'{test_name}.json'} {new_snapshot_file}"
        )


def test_create_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("createEventPlace")
    snapshot = _load_snapshot("createEventPlace")
    _assert_events_match_snapshot("createEventPlace", events, snapshot)


def test_update_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("updateEventPlace")
    snapshot = _load_snapshot("updateEventPlace")
    _assert_events_match_snapshot("updateEventPlace", events, snapshot)


def test_submit_event_request(events_factory: EventsFactory) -> None:
    events = events_factory("submitEventRequest")
    snapshot = _load_snapshot("submitEventRequest")
    _assert_events_match_snapshot("submitEventRequest", events, snapshot)


def test_approve_event(events_factory: EventsFactory) -> None:
    events = events_factory("approveEvent")
    snapshot = _load_snapshot("approveEvent")
    _assert_events_match_snapshot("approveEvent", events, snapshot)


def test_decline_event(events_factory: EventsFactory) -> None:
    events = events_factory("declineEvent")
    snapshot = _load_snapshot("declineEvent")
    _assert_events_match_snapshot("declineEvent", events, snapshot)


def test_update_event(events_factory: EventsFactory) -> None:
    events = events_factory("updateEvent")
    snapshot = _load_snapshot("updateEvent")
    _assert_events_match_snapshot("updateEvent", events, snapshot)


def test_cancel_event(events_factory: EventsFactory) -> None:
    events = events_factory("cancelEvent")
    snapshot = _load_snapshot("cancelEvent")
    _assert_events_match_snapshot("cancelEvent", events, snapshot)
