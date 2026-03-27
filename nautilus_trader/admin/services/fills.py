from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import FillsSnapshot


def build_fills_snapshot(*, limit: int) -> FillsSnapshot:
    return FillsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
    )
