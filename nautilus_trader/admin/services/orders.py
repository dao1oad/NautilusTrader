from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import OrdersSnapshot


def build_orders_snapshot(*, limit: int) -> OrdersSnapshot:
    return OrdersSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
    )
