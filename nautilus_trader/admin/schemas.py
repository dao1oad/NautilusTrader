from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from pydantic import Field

class HealthStatus(BaseModel):
    status: str


class NodeSummary(BaseModel):
    status: str
    node_id: str | None = None


class StrategySummary(BaseModel):
    strategy_id: str
    status: str


class AdapterSummary(BaseModel):
    adapter_id: str
    status: str


class AccountSummary(BaseModel):
    account_id: str
    status: str


class PositionSummary(BaseModel):
    instrument_id: str
    side: Literal["long", "short", "flat"]
    quantity: str


class SectionError(BaseModel):
    section: str
    message: str


class OverviewSnapshot(BaseModel):
    generated_at: datetime
    stale: bool = False
    partial: bool = False
    node: NodeSummary
    strategies: list[StrategySummary] = Field(default_factory=list)
    adapters: list[AdapterSummary] = Field(default_factory=list)
    accounts: list[AccountSummary] = Field(default_factory=list)
    positions: list[PositionSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)
