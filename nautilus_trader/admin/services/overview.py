from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import NodeSummary
from nautilus_trader.admin.schemas import OverviewSnapshot
from nautilus_trader.admin.schemas import SectionError


def build_overview_snapshot(*, inject_partial_error: bool = False) -> OverviewSnapshot:
    errors: list[SectionError] = []
    partial = False

    if inject_partial_error:
        partial = True
        errors.append(
            SectionError(
                section="execution",
                message="Injected partial failure for admin overview testing.",
            ),
        )

    return OverviewSnapshot(
        generated_at=datetime.now(tz=UTC),
        stale=False,
        partial=partial,
        node=NodeSummary(status="not_configured"),
        errors=errors,
    )
