from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import ReportsSnapshot
from nautilus_trader.admin.schemas import ReportSummary


REPORT_SUMMARIES = [
    ReportSummary(
        report_id="REP-20260327-01",
        run_id="RUN-20260327-EMA-01",
        strategy_id="ema-cross-btc",
        instrument_id="BTCUSDT-PERP.BINANCE",
        generated_at=datetime(2026, 3, 27, 8, 12, tzinfo=UTC),
        net_pnl="+1240.50 USDT",
        return_pct="+3.8%",
        max_drawdown="-0.9%",
        sharpe_ratio="1.84",
        win_rate="58%",
        artifacts=["orders", "fills", "positions", "account"],
        summary="Orders, fills, positions, and account reports are ready for operator review.",
    ),
    ReportSummary(
        report_id="REP-20260327-03",
        run_id="RUN-20260327-RSI-01",
        strategy_id="rsi-breakout-sol",
        instrument_id="SOLUSDT-PERP.BINANCE",
        generated_at=datetime(2026, 3, 27, 6, 45, tzinfo=UTC),
        net_pnl="-210.20 USDT",
        return_pct="-0.6%",
        max_drawdown="-1.7%",
        sharpe_ratio="0.41",
        win_rate="46%",
        artifacts=["orders", "fills", "positions"],
        summary="Position snapshots show two drawdown clusters around the Asia open.",
    ),
]


def build_reports_snapshot(*, limit: int) -> ReportsSnapshot:
    return ReportsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
        items=REPORT_SUMMARIES[:limit],
    )
