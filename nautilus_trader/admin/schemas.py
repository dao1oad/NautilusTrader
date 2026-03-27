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


class AccountsSummary(BaseModel):
    active_accounts: int
    total_equity: str
    available_cash: str
    margin_used: str
    margin_available: str
    gross_exposure: str
    net_exposure: str


class AccountBalanceSummary(BaseModel):
    asset: str
    total: str
    available: str
    locked: str


class AccountExposureSummary(BaseModel):
    instrument_id: str
    side: Literal["long", "short", "flat"]
    net_quantity: str
    notional: str
    leverage: str


class AccountSummary(BaseModel):
    account_id: str
    venue: str | None = None
    account_type: str | None = None
    status: str
    base_currency: str | None = None
    total_equity: str | None = None
    available_cash: str | None = None
    margin_used: str | None = None
    margin_available: str | None = None
    margin_ratio: str | None = None
    gross_exposure: str | None = None
    net_exposure: str | None = None
    updated_at: datetime | None = None
    balances: list[AccountBalanceSummary] = Field(default_factory=list)
    exposures: list[AccountExposureSummary] = Field(default_factory=list)
    alerts: list[str] = Field(default_factory=list)


class RiskSummary(BaseModel):
    trading_state: str
    risk_level: str
    margin_utilization: str
    exposure_utilization: str
    active_alerts: int
    blocked_actions: int


class RiskEvent(BaseModel):
    event_id: str
    severity: Literal["info", "warn", "critical"]
    title: str
    message: str
    occurred_at: datetime


class RiskBlock(BaseModel):
    block_id: str
    scope: str
    reason: str
    status: Literal["active", "cleared"]
    raised_at: datetime


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


class CatalogEntry(BaseModel):
    catalog_id: str
    instrument_id: str
    data_type: Literal["bars", "trades", "quotes"]
    timeframe: str
    status: Literal["ready", "warming", "delayed"]
    row_count: int
    first_record_at: datetime
    last_record_at: datetime


class HistoryQuery(BaseModel):
    catalog_id: str
    instrument_id: str
    data_type: Literal["bars", "trades", "quotes"]
    start_time: datetime
    end_time: datetime
    limit: int
    returned_rows: int
    feedback: str


class PlaybackRequest(BaseModel):
    request_id: str
    catalog_id: str
    instrument_id: str
    start_time: datetime
    end_time: datetime
    limit: int
    speed: str
    event_types: list[str] = Field(default_factory=list)
    feedback: str


class PlaybackTimelinePoint(BaseModel):
    timestamp: datetime
    mid_price: str
    cumulative_events: int


class PlaybackEventSummary(BaseModel):
    timestamp: datetime
    event_type: str
    summary: str


class DiagnosticsSummary(BaseModel):
    overall_status: Literal["healthy", "degraded", "partial"]
    healthy_links: int
    degraded_links: int
    slow_queries: int
    latest_catalog_sync_at: datetime


class LinkHealth(BaseModel):
    link_id: str
    label: str
    status: Literal["healthy", "degraded"]
    latency_ms: int
    last_checked_at: datetime
    detail: str


class QueryTiming(BaseModel):
    query_id: str
    surface: Literal["catalog", "playback", "diagnostics"]
    status: Literal["ok", "slow", "failed"]
    limit: int
    window_start: datetime
    window_end: datetime
    returned_rows: int
    duration_ms: int
    detail: str


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
    summary: AccountsSummary
    partial: bool = False
    items: list[AccountSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class RiskSnapshot(BaseModel):
    generated_at: datetime
    summary: RiskSummary
    partial: bool = False
    events: list[RiskEvent] = Field(default_factory=list)
    blocks: list[RiskBlock] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class LogsSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    partial: bool = False
    items: list[LogSummary] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class CatalogSnapshot(BaseModel):
    generated_at: datetime
    limit: int
    history_query: HistoryQuery
    partial: bool = False
    items: list[CatalogEntry] = Field(default_factory=list)
    operator_notes: list[str] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class PlaybackSnapshot(BaseModel):
    generated_at: datetime
    request: PlaybackRequest
    partial: bool = False
    timeline: list[PlaybackTimelinePoint] = Field(default_factory=list)
    events: list[PlaybackEventSummary] = Field(default_factory=list)
    operator_notes: list[str] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)


class DiagnosticsSnapshot(BaseModel):
    generated_at: datetime
    summary: DiagnosticsSummary
    partial: bool = False
    links: list[LinkHealth] = Field(default_factory=list)
    query_timings: list[QueryTiming] = Field(default_factory=list)
    errors: list[SectionError] = Field(default_factory=list)
