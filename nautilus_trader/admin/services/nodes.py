from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import NodesSnapshot


def build_nodes_snapshot() -> NodesSnapshot:
    return NodesSnapshot(
        generated_at=datetime.now(tz=UTC),
    )
