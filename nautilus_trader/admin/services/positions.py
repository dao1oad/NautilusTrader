from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import PositionsSnapshot


def build_positions_snapshot(*, limit: int) -> PositionsSnapshot:
    return PositionsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
    )
