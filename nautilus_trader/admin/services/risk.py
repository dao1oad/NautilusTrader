from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import RiskBlock
from nautilus_trader.admin.schemas import RiskEvent
from nautilus_trader.admin.schemas import RiskSnapshot
from nautilus_trader.admin.schemas import RiskSummary


RISK_SUMMARY = RiskSummary(
    trading_state="reducing",
    risk_level="elevated",
    margin_utilization="0.54",
    exposure_utilization="0.67",
    active_alerts=2,
    blocked_actions=1,
)

RISK_EVENTS = [
    RiskEvent(
        event_id="margin-buffer-warning",
        severity="warn",
        title="Margin buffer narrowing",
        message="BTC book is using 54% of the configured margin budget.",
        occurred_at=datetime(2026, 3, 27, 8, 55, tzinfo=UTC),
    ),
    RiskEvent(
        event_id="exposure-band-watch",
        severity="info",
        title="Concentrated long exposure",
        message="BTC directional exposure is approaching the soft portfolio threshold.",
        occurred_at=datetime(2026, 3, 27, 8, 54, tzinfo=UTC),
    ),
]

RISK_BLOCKS = [
    RiskBlock(
        block_id="reduce-only-btc",
        scope="orders/BTCUSDT-PERP.BINANCE",
        reason="Reduce-only guard enabled while the margin cushion recovers.",
        status="active",
        raised_at=datetime(2026, 3, 27, 8, 57, tzinfo=UTC),
    ),
]


def build_risk_snapshot() -> RiskSnapshot:
    return RiskSnapshot(
        generated_at=datetime.now(tz=UTC),
        summary=RISK_SUMMARY,
        events=RISK_EVENTS,
        blocks=RISK_BLOCKS,
    )
