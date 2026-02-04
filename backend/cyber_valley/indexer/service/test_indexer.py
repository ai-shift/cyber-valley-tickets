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
            quiet=True,
        )
    subprocess.run("pkill -f node.*hardhat.*.js", shell=True, check=False)  # noqa: S602, S607
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
            contracts = _get_all_contracts(w3)

            print(f"\n{'=' * 80}")
            print("EVENTS PROCESSING REPORT")
            print(f"{'=' * 80}")
            print(f"Total logs retrieved: {len(logs)}\n")

            # Group logs by transaction
            logs_by_tx: dict[str, list[LogReceipt]] = {}
            for log in logs:
                tx_hash = log.get("transactionHash", "unknown")
                tx_hash_str = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
                if tx_hash_str not in logs_by_tx:
                    logs_by_tx[tx_hash_str] = []
                logs_by_tx[tx_hash_str].append(log)

            events = []
            processed_count = 0
            failed_count = 0

            for tx_idx, (tx_hash, tx_logs) in enumerate(logs_by_tx.items(), 1):
                print(f"\n{'-' * 80}")
                print(f"Transaction {tx_idx}: {tx_hash[:20]}...{tx_hash[-10:]}")
                print(f"Events in this transaction: {len(tx_logs)}")
                print(f"{'-' * 80}")

                for log_idx, log in enumerate(tx_logs, 1):
                    block_num = log.get("blockNumber", "?")
                    log_index = log.get("logIndex", "?")
                    address = log.get("address", "?")
                    topics_raw = log.get("topics", [])
                    topics: list[str] = [
                        t.hex() if hasattr(t, "hex") else str(t) for t in topics_raw
                    ]

                    print(
                        f"\n  Event {log_idx}/{len(tx_logs)} (Block: {block_num},"
                        f"LogIndex: {log_index})"
                    )
                    print(f"  Contract: {address!r}")
                    print(
                        f"  Topic[0] (event signature):"
                        f" {topics[0] if topics else 'N/A'}"
                    )

                    # Try to decode the event name from contracts
                    event_name = _get_event_name_from_topic(
                        topics[0] if topics else None, contracts
                    )
                    if event_name:
                        print(f"  Event name: {event_name}")

                    try:
                        event = indexer.parse_log(log, contracts).unwrap()
                        event_type = (
                            f"{event.__class__.__module__.split('.')[-1]}"
                            f".{event.__class__.__name__}"
                        )
                        print(f"  ✓ Successfully parsed as: {event_type}")
                        events.append(event)
                        processed_count += 1
                    except Exception as e:
                        print(f"  ✗ FAILED to parse: {type(e).__name__}: {e}")
                        failed_count += 1
                        raise

            print(f"\n{'=' * 80}")
            print("SUMMARY")
            print(f"{'=' * 80}")
            print(f"Total transactions: {len(logs_by_tx)}")
            print(f"Total events: {len(logs)}")
            print(f"Successfully processed: {processed_count}")
            print(f"Failed: {failed_count}")
            print(f"{'=' * 80}\n")

            return events

    return inner


def _execute(
    command: str,
    *,
    yield_after_line: None | str = None,
    timeout: int = 5,
    env: None | dict[str, str] = None,
    quiet: bool = False,
) -> ProcessStarter:
    output_lines: list[str] = []

    def _capture_output(proc: subprocess.Popen[str]) -> None:
        assert proc.stdout
        for line in proc.stdout:
            output_lines.append(line)
            if not quiet:
                print(line, end="", flush=True)

    proc = subprocess.Popen(  # noqa: S602
        command,
        cwd=ETHEREUM_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        text=True,
        env=os.environ.copy() | (env or {}),
    )

    output_thread = threading.Thread(target=partial(_capture_output, proc))
    output_thread.start()

    if yield_after_line:
        t = threading.Thread(target=partial(_wait_for_line, proc, yield_after_line))
        t.start()
        t.join(timeout=timeout)
    else:
        proc.wait()

    yield
    proc.kill()
    output_thread.join(timeout=1)

    print(f"\n=== End of command: {command} ===")


def _wait_for_line(proc: subprocess.Popen[str], return_after_line: str) -> None:
    assert proc.stdout
    while return_after_line not in proc.stdout.readline():
        pass


def _get_event_name_from_topic(
    topic: str | None, contracts: list[type[Contract]]
) -> str | None:
    if not topic:
        return None

    for contract in contracts:
        events_obj = contract.events
        if not hasattr(events_obj, "_events"):
            continue
        events_dict = events_obj._events  # noqa: SLF001
        if not hasattr(events_dict, "items"):
            continue
        for event_name, event_abi in events_dict.items():
            if hasattr(event_abi, "event_signature_hash"):
                sig_hash = event_abi.event_signature_hash
                if hasattr(sig_hash, "hex") and sig_hash.hex() == topic:
                    return str(event_name)

    return None


def _load_snapshot(test_name: str) -> dict[str, Any] | None:
    snapshot_file = SNAPSHOTS_DIR / f"{test_name}.json"
    if not snapshot_file.exists():
        return None
    content: dict[str, Any] = json.loads(snapshot_file.read_text())
    return content


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


def test_submit_event_place_request(events_factory: EventsFactory) -> None:
    events = events_factory("submitEventPlaceRequest")
    snapshot = _load_snapshot("submitEventPlaceRequest")
    _assert_events_match_snapshot("submitEventPlaceRequest", events, snapshot)


def test_approve_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("approveEventPlace")
    snapshot = _load_snapshot("approveEventPlace")
    _assert_events_match_snapshot("approveEventPlace", events, snapshot)


def test_decline_event_place(events_factory: EventsFactory) -> None:
    events = events_factory("declineEventPlace")
    snapshot = _load_snapshot("declineEventPlace")
    _assert_events_match_snapshot("declineEventPlace", events, snapshot)


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
