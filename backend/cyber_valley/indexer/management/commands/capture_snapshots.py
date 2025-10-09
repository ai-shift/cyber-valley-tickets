import json
import os
import subprocess
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand
from hexbytes import HexBytes
from pydantic import BaseModel
from returns.result import Success
from web3 import Web3

from ...service import indexer

ETHEREUM_DIR = settings.BASE_DIR.parent / "ethereum"
SNAPSHOTS_DIR = Path(settings.BASE_DIR) / "cyber_valley" / "indexer" / "service" / "snapshots"


class Command(BaseCommand):
    help = "Capture event snapshots from Hardhat tests for indexer testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "test_names",
            nargs="*",
            type=str,
            help="Names of Hardhat tests to capture (default: all)",
        )

    def handle(self, *args, **options):
        test_names = options["test_names"] or [
            "createEventPlace",
            "updateEventPlace",
            "submitEventRequest",
            "approveEvent",
            "declineEvent",
            "updateEvent",
        ]

        for test_name in test_names:
            self.stdout.write(f"Capturing snapshot for {test_name}...")
            try:
                self.capture_test_snapshot(test_name)
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Captured snapshot for {test_name}")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ Failed to capture {test_name}: {e}")
                )
                raise

        self.stdout.write(self.style.SUCCESS("\nAll snapshots updated successfully!"))

    def capture_test_snapshot(self, test_name: str) -> None:
        self.reset_blockchain()
        self.run_hardhat_test(test_name)
        data = self.capture_events(test_name)
        self.save_snapshot(test_name, data)

    def reset_blockchain(self) -> None:
        w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))
        if not w3.is_connected():
            raise RuntimeError("Cannot connect to hardhat node")

        w3.provider.make_request("hardhat_reset", [])  # type: ignore[arg-type]

    def run_hardhat_test(self, test_name: str) -> None:
        result = subprocess.run(
            [
                "pnpm",
                "exec",
                "hardhat",
                "--network",
                "localhost",
                "test",
                "--grep",
                test_name,
            ],
            cwd=ETHEREUM_DIR,
            env={
                **os.environ,
                "DISABLE_BLOCKHAIN_RESTORE": "1",
            },
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            self.stdout.write(self.style.ERROR("STDOUT:"))
            self.stdout.write(result.stdout)
            self.stdout.write(self.style.ERROR("STDERR:"))
            self.stdout.write(result.stderr)
            raise RuntimeError(f"Test {test_name} failed")

    def capture_events(self, test_name: str) -> dict[str, Any]:
        w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))
        if not w3.is_connected():
            raise RuntimeError("Cannot connect to hardhat node")

        contracts = [
            w3.eth.contract(abi=json.loads(info_path.read_text())["abi"])
            for info_path in settings.CONTRACTS_INFO
        ]

        logs = w3.eth.filter({"fromBlock": 0, "toBlock": "latest"}).get_all_entries()

        events: list[BaseModel] = []
        for log in logs:
            if log["topics"]:
                result = indexer.parse_log(log, contracts)
                if isinstance(result, Success):
                    events.append(result.unwrap())

        events_by_type: dict[str, list[dict[str, Any]]] = {}
        for event in events:
            event_type = event.__class__.__name__
            full_type = f"{event.__class__.__module__.split('.')[-1]}.{event_type}"

            serialized = self._serialize_event(event)

            if full_type not in events_by_type:
                events_by_type[full_type] = []
            events_by_type[full_type].append(serialized)

        return {
            "test_name": test_name,
            "events_count": len(events),
            "events_by_type": events_by_type,
        }

    def _serialize_event(self, event: BaseModel) -> dict[str, Any]:
        data = event.model_dump(by_alias=True)
        for key, value in data.items():
            if isinstance(value, HexBytes):
                data[key] = value.hex()
        return data

    def save_snapshot(self, test_name: str, data: dict[str, Any]) -> None:
        SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        snapshot_file = SNAPSHOTS_DIR / f"{test_name}.json"
        snapshot_file.write_text(json.dumps(data, indent=2, sort_keys=True))
        self.stdout.write(f"  Saved to {snapshot_file}")
        self.stdout.write(f"  Events captured: {data['events_count']}")
