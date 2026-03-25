from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import LogsSnapshot
from nautilus_trader.admin.schemas import SectionError


def build_logs_snapshot(*, limit: int, inject_partial_error: bool = False) -> LogsSnapshot:
    errors: list[SectionError] = []
    partial = False

    if inject_partial_error:
        partial = True
        errors.append(
            SectionError(
                section="logs",
                message="Injected partial failure for admin logs testing.",
            ),
        )

    return LogsSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
        partial=partial,
        errors=errors,
    )
