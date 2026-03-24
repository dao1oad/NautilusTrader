from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import StrategiesSnapshot


def build_strategies_snapshot() -> StrategiesSnapshot:
    return StrategiesSnapshot(
        generated_at=datetime.now(tz=UTC),
    )
