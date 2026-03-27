from __future__ import annotations

from datetime import UTC
from datetime import datetime

from nautilus_trader.admin.schemas import DiagnosticsSnapshot
from nautilus_trader.admin.schemas import DiagnosticsSummary
from nautilus_trader.admin.schemas import LinkHealth
from nautilus_trader.admin.schemas import QueryTiming
from nautilus_trader.admin.schemas import SectionError


def _build_links(*, inject_partial_error: bool) -> list[LinkHealth]:
    links = [
        LinkHealth(
            link_id="catalog-primary",
            label="Primary parquet catalog",
            status="healthy",
            latency_ms=42,
            last_checked_at=datetime(2026, 3, 27, 9, 2, tzinfo=UTC),
            detail="Heartbeat within the 100 ms operator budget.",
        ),
        LinkHealth(
            link_id="catalog-archive",
            label="Archive parquet catalog",
            status="degraded",
            latency_ms=184,
            last_checked_at=datetime(2026, 3, 27, 9, 2, tzinfo=UTC),
            detail="Archive scans are above the latency budget but still returning bounded snapshots.",
        ),
        LinkHealth(
            link_id="playback-engine",
            label="Playback preview worker",
            status="healthy",
            latency_ms=67,
            last_checked_at=datetime(2026, 3, 27, 9, 2, tzinfo=UTC),
            detail="Preview worker is accepting bounded replay requests.",
        ),
    ]

    if not inject_partial_error:
        return links

    links[0] = links[0].model_copy(
        update={
            "status": "degraded",
            "latency_ms": 480,
            "detail": "Primary catalog heartbeat timed out while refreshing diagnostics.",
        },
    )

    return links


def _build_query_timings() -> list[QueryTiming]:
    return [
        QueryTiming(
            query_id="catalog-history-btc",
            surface="catalog",
            status="slow",
            limit=100,
            window_start=datetime(2026, 3, 27, 7, 0, tzinfo=UTC),
            window_end=datetime(2026, 3, 27, 9, 0, tzinfo=UTC),
            returned_rows=100,
            duration_ms=1480,
            detail="Catalog scan hit the operator warning threshold but remained bounded.",
        ),
        QueryTiming(
            query_id="playback-preview-btc",
            surface="playback",
            status="ok",
            limit=100,
            window_start=datetime(2026, 3, 27, 7, 30, tzinfo=UTC),
            window_end=datetime(2026, 3, 27, 8, 0, tzinfo=UTC),
            returned_rows=61,
            duration_ms=620,
            detail="Playback preview stayed inside the fast operator budget.",
        ),
    ]


def build_diagnostics_snapshot(*, inject_partial_error: bool = False) -> DiagnosticsSnapshot:
    links = _build_links(inject_partial_error=inject_partial_error)
    errors: list[SectionError] = []
    partial = False
    summary_status = "degraded"

    if inject_partial_error:
        partial = True
        summary_status = "partial"
        errors.append(
            SectionError(
                section="diagnostics.links",
                message="Primary catalog heartbeat timed out while refreshing diagnostics.",
            ),
        )

    degraded_links = sum(1 for link in links if link.status == "degraded")

    return DiagnosticsSnapshot(
        generated_at=datetime.now(tz=UTC),
        summary=DiagnosticsSummary(
            overall_status=summary_status,
            healthy_links=len(links) - degraded_links,
            degraded_links=degraded_links,
            slow_queries=1,
            latest_catalog_sync_at=datetime(2026, 3, 27, 9, 1, tzinfo=UTC),
        ),
        partial=partial,
        links=links,
        query_timings=_build_query_timings(),
        errors=errors,
    )
