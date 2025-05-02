import subprocess
import threading
from collections.abc import Callable, Generator
from contextlib import AbstractContextManager, contextmanager
from functools import partial
from pathlib import Path
from typing import Final

import pytest
from pytest_print import Printer

ETHEREUM_DIR: Final = Path(__file__).parent.parent.parent.parent.parent / "ethereum"
ETH_NETWORK_HOST: Final = "localhost:8545"

ProcessStarter = Generator[None]


@pytest.fixture(autouse=True)
def run_hardhat_node(printer_session: Printer) -> ProcessStarter:
    printer_session("Starting hardhat node")
    # Pathetic hardhat, impossible to set port of the node via CMD
    yield from _execute(
        "pnpm exec hardhat node --fulltrace",
        yield_after_line="Started HTTP and WebSocket JSON-RPC server",
    )
    printer_session("Hardhat node terminated")


HardhatTestRunner = Callable[[str], AbstractContextManagero[None]]


@pytest.fixture
def run_hardhat_test(printer_session: Printer) -> HardhatTestRunner:
    @contextmanager
    def inner(test_to_run: str) -> ProcessStarter:
        printer_session(f"Starting hardhat test of {test_to_run}")
        yield from _execute(
            f"pnpm exec hardhat --network localhost test --grep {test_to_run}"
        )
        printer_session(f"Hardhat test finished of {test_to_run}")

    return inner


def _execute(
    command: str, *, yield_after_line: None | str = None, timeout: int = 5
) -> ProcessStarter:
    proc = subprocess.Popen(  # noqa: S602
        command,
        cwd=ETHEREUM_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        text=True,
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


def test_create_event(run_hardhat_test: HardhatTestRunner) -> None:
    with run_hardhat_test("createEvent"):
        pytest.fail("Not implemented")


def test_update_event_place(run_hardhat_test: HardhatTestRunner) -> None:
    with run_hardhat_test("updateEventPlace"):
        pytest.fail("Not implemented")
