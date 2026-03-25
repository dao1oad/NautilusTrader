from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import AccountsSnapshot


def build_accounts_snapshot(*, limit: int) -> AccountsSnapshot:
    return AccountsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
    )
