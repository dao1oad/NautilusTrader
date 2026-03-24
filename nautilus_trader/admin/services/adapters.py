from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import AdaptersSnapshot


def build_adapters_snapshot() -> AdaptersSnapshot:
    return AdaptersSnapshot(
        generated_at=datetime.now(tz=UTC),
    )
