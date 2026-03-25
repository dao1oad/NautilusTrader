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


class OrderSummary(BaseModel):
    client_order_id: str
    instrument_id: str
    side: Literal["buy", "sell"]
    quantity: str
    status: str


class AccountSummary(BaseModel):
    account_id: str
    status: str


class PositionSummary(BaseModel):
    instrument_id: str
    side: Literal["long", "short", "flat"]
    quantity: str


class LogSummary(BaseModel):
    timestamp: datetime
    level: Literal["DEBUG", "INFO", "WARN", "ERROR"]
    component: str
    message: str


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


class NodesSnapshot(BaseModel):
    generated_at: datetime
    partial: bool = False
    items: list[NodeSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class StrategiesSnapshot(BaseModel):
    generated_at: datetime
    partial: bool = False
    items: list[StrategySummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class AdaptersSnapshot(BaseModel):
    generated_at: datetime
    partial: bool = False
    items: list[AdapterSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class OrdersSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    partial: bool = False
    items: list[OrderSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class PositionsSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    partial: bool = False
    items: list[PositionSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class AccountsSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    partial: bool = False
    items: list[AccountSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class LogsSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    partial: bool = False
    items: list[LogSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)
