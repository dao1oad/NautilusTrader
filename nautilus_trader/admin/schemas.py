from __future__ import annotations

from datetime import UTC
from datetime import datetime
from enum import Enum
from typing import Any
from typing import Literal
from uuid import uuid4

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


class FillSummary(BaseModel):
    fill_id: str
    client_order_id: str
    instrument_id: str
    side: Literal["buy", "sell"]
    quantity: str
    price: str
    liquidity_side: str
    timestamp: datetime


class AccountSummary(BaseModel):
    account_id: str
    status: str


class PositionSummary(BaseModel):
    position_id: str | None = None
    instrument_id: str
    side: Literal["long", "short", "flat"]
    quantity: str
    entry_price: str | None = None
    unrealized_pnl: str | None = None
    realized_pnl: str | None = None
    opened_at: datetime | None = None
    updated_at: datetime | None = None


class LogSummary(BaseModel):
    timestamp: datetime
    level: Literal["DEBUG", "INFO", "WARN", "ERROR"]
    component: str
    message: str


class CommandErrorCode(str, Enum):
    INVALID_REQUEST = "invalid_request"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    NOT_SUPPORTED = "not_supported"
    UNAVAILABLE = "unavailable"
    INTERNAL_ERROR = "internal_error"


class CommandFailure(BaseModel):
    code: CommandErrorCode
    message: str
    retryable: bool = False
    details: dict[str, Any] = Field(default_factory=dict)


class CommandRequest(BaseModel):
    command: str
    target: str
    payload: dict[str, Any] = Field(default_factory=dict)
    requested_by: str = "local-operator"
    command_id: str = Field(default_factory=lambda: str(uuid4()))
    requested_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))


class CommandReceipt(BaseModel):
    command_id: str
    command: str
    target: str
    status: Literal["accepted", "completed", "failed"]
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))
    message: str | None = None
    failure: CommandFailure | None = None


class AuditRecord(BaseModel):
    sequence_id: int
    command_id: str
    command: str
    target: str | None = None
    status: Literal["accepted", "completed", "failed"]
    payload: dict[str, Any] = Field(default_factory=dict)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))
    message: str | None = None
    failure: CommandFailure | None = None


class AuditSnapshot(BaseModel):
    generated_at: datetime
    partial: bool = False
    items: list[AuditRecord] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class ConfigDiffEntry(BaseModel):
    key: str
    summary: str
    desired: str
    actual: str
    status: Literal["in_sync", "drifted"]
    runbook_id: str | None = None


class RecoveryRunbook(BaseModel):
    runbook_id: str
    title: str
    summary: str
    steps: list[str] = Field(default_factory=list)


class ConfigDiffSnapshot(BaseModel):
    generated_at: datetime
    items: list[ConfigDiffEntry] = Field(default_factory=list)
    runbooks: list[RecoveryRunbook] = Field(default_factory=list)


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


class FillsSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    partial: bool = False
    items: list[FillSummary] = Field(default_factory=list)
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
