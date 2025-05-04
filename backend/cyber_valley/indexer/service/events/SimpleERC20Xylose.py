# noqa: N999


from __future__ import annotations

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
