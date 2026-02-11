import os
import secrets
from typing import Any, Literal

import base58
import ipfshttpclient
import pytest


class _FakeIPFSClient:
    """
    Minimal in-memory IPFS client for unit tests.

    We only implement the methods used by this repo: add_json/get_json, plus
    context-manager support (with ipfshttpclient.connect()).
    """

    def __init__(self, store: dict[str, Any]) -> None:
        self._store = store

    def __enter__(self) -> "_FakeIPFSClient":
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> Literal[False]:
        return False

    @staticmethod
    def _new_cid_v0() -> str:
        # CIDv0 is a base58btc-encoded multihash (sha2-256, 32 bytes).
        multihash = bytes([18, 32]) + secrets.token_bytes(32)
        return base58.b58encode(multihash).decode("ascii")

    def add_json(self, data: Any) -> str:
        cid = self._new_cid_v0()
        self._store[cid] = data
        return cid

    def get_json(self, cid: str) -> Any:
        return self._store[cid]


@pytest.fixture(autouse=True)
def _mock_ipfs(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    Prevent unit tests from requiring a running IPFS daemon.

    Set USE_REAL_IPFS=1 to disable this fixture and hit a real IPFS node.
    """
    if os.environ.get("USE_REAL_IPFS") == "1":
        return

    store: dict[str, Any] = {}

    def _connect(*_args: object, **_kwargs: object) -> _FakeIPFSClient:
        return _FakeIPFSClient(store)

    monkeypatch.setattr(ipfshttpclient, "connect", _connect, raising=True)
