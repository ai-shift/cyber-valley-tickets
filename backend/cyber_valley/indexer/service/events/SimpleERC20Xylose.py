# noqa: N999


from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Approval(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    owner: str
    spender: str
    value: int


class Transfer(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    from_: str = Field(..., alias="from")
    to: str
    value: int


class CyberValleyEvents(BaseModel):
    model_config = ConfigDict(
        frozen=True,
    )
    approval: Approval | None = Field(None, alias="Approval")
    eip712_domain_changed: dict[str, Any] | None = Field(
        None, alias="EIP712DomainChanged"
    )
    transfer: Transfer | None = Field(None, alias="Transfer")
