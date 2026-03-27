from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import BacktestTaskSummary
from nautilus_trader.admin.schemas import BacktestsSnapshot


BACKTEST_TASKS = [
    BacktestTaskSummary(
        task_id="BT-20260327-01",
        run_id="RUN-20260327-EMA-01",
        strategy_id="ema-cross-btc",
        catalog_id="primary-parquet",
        instrument_id="BTCUSDT-PERP.BINANCE",
        status="completed",
        requested_at=datetime(2026, 3, 27, 8, 5, tzinfo=UTC),
        started_at=datetime(2026, 3, 27, 8, 6, tzinfo=UTC),
        finished_at=datetime(2026, 3, 27, 8, 11, tzinfo=UTC),
        progress_pct=100,
        report_id="REP-20260327-01",
        result_summary="Completed 5,842 bars with net PnL +1240.50 USDT and generated report REP-20260327-01.",
    ),
    BacktestTaskSummary(
        task_id="BT-20260327-02",
        run_id="RUN-20260327-MMR-01",
        strategy_id="mean-reversion-eth",
        catalog_id="archive-parquet",
        instrument_id="ETHUSDT-PERP.BINANCE",
        status="running",
        requested_at=datetime(2026, 3, 27, 8, 15, tzinfo=UTC),
        started_at=datetime(2026, 3, 27, 8, 17, tzinfo=UTC),
        finished_at=None,
        progress_pct=72,
        report_id=None,
        result_summary="Streaming a 90 minute replay across 42,800 trades while the operator watches partial risk checkpoints.",
    ),
]


def build_backtests_snapshot(*, limit: int) -> BacktestsSnapshot:
    return BacktestsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
        items=BACKTEST_TASKS[:limit],
    )
