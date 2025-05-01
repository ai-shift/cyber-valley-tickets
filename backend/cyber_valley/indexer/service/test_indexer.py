import threading
from typing import Final
from pathlib import Path
import subprocess

import pytest

ETHEREUM_DIR: Final = Path(__file__).parent.parent.parent.parent.parent / "ethereum"


@pytest.fixture(scope="module", autouse=True)
def run_hardhat_node():
    command = "pnpm exec hardhat node"
    process = subprocess.Popen(
        command,
        cwd=ETHEREUM_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        text=True
    )

    def wait_for_node_start() -> None:
        while True:
            line = process.stdout.readline()
            if "Started HTTP and WebSocket JSON-RPC server" in line:
                return

    t = threading.Thread(target=wait_for_node_start)
    t.start()
    t.join(timeout=5)

    yield

    process.terminate()


def test_foo() -> None:
    pytest.fail("Not implemented")
