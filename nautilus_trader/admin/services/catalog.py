from __future__ import annotations

from datetime import UTC
from datetime import datetime
from datetime import timedelta

from nautilus_trader.admin.schemas import CatalogEntry
from nautilus_trader.admin.schemas import CatalogSnapshot
from nautilus_trader.admin.schemas import HistoryQuery
from nautilus_trader.admin.schemas import PlaybackEventSummary
from nautilus_trader.admin.schemas import PlaybackRequest
from nautilus_trader.admin.schemas import PlaybackSnapshot
from nautilus_trader.admin.schemas import PlaybackTimelinePoint


DEFAULT_CATALOG_START_TIME = datetime(2026, 3, 27, 7, 0, tzinfo=UTC)
DEFAULT_CATALOG_END_TIME = datetime(2026, 3, 27, 9, 0, tzinfo=UTC)
DEFAULT_PLAYBACK_START_TIME = datetime(2026, 3, 27, 7, 30, tzinfo=UTC)
DEFAULT_PLAYBACK_END_TIME = datetime(2026, 3, 27, 8, 0, tzinfo=UTC)

CATALOG_ITEMS = [
    CatalogEntry(
        catalog_id="primary-parquet",
        instrument_id="BTCUSDT-PERP.BINANCE",
        data_type="bars",
        timeframe="1m",
        status="ready",
        row_count=18420,
        first_record_at=datetime(2026, 3, 26, 0, 0, tzinfo=UTC),
        last_record_at=datetime(2026, 3, 27, 9, 0, tzinfo=UTC),
    ),
    CatalogEntry(
        catalog_id="primary-parquet",
        instrument_id="ETHUSDT-PERP.BINANCE",
        data_type="trades",
        timeframe="tick",
        status="ready",
        row_count=96210,
        first_record_at=datetime(2026, 3, 27, 6, 0, tzinfo=UTC),
        last_record_at=datetime(2026, 3, 27, 9, 0, tzinfo=UTC),
    ),
    CatalogEntry(
        catalog_id="archive-parquet",
        instrument_id="BTCUSDT-PERP.BINANCE",
        data_type="quotes",
        timeframe="tick",
        status="warming",
        row_count=228440,
        first_record_at=datetime(2026, 3, 25, 0, 0, tzinfo=UTC),
        last_record_at=datetime(2026, 3, 27, 8, 55, tzinfo=UTC),
    ),
]

CATALOG_OPERATOR_NOTES = [
    "Large catalog reads are capped by limit and explicit UTC time range before operators fan out deeper analysis.",
    "Use the paired playback request to preview the same bounded window before replaying events.",
]

PLAYBACK_OPERATOR_NOTES = [
    "Replay requests stay within a bounded UTC window and projected event limit before operators run a full playback job.",
]


def _format_window(start_time: datetime, end_time: datetime) -> str:
    total_minutes = max(int((end_time - start_time).total_seconds() // 60), 1)
    hours, minutes = divmod(total_minutes, 60)

    if minutes == 0:
        return f"{hours} hour"

    return f"{total_minutes} minute"


def build_catalog_snapshot(
    *,
    limit: int,
    start_time: datetime,
    end_time: datetime,
) -> CatalogSnapshot:
    returned_rows = min(limit, 100)

    return CatalogSnapshot(
        generated_at=datetime.now(tz=UTC),
        limit=limit,
        history_query=HistoryQuery(
            catalog_id="primary-parquet",
            instrument_id="BTCUSDT-PERP.BINANCE",
            data_type="bars",
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            returned_rows=returned_rows,
            feedback=f"History query capped at {limit} rows across the selected {_format_window(start_time, end_time)} window.",
        ),
        items=CATALOG_ITEMS[:limit],
        operator_notes=list(CATALOG_OPERATOR_NOTES),
    )


def build_playback_snapshot(
    *,
    limit: int,
    start_time: datetime,
    end_time: datetime,
    speed: str = "25x",
) -> PlaybackSnapshot:
    window = end_time - start_time
    step = window / 3 if window.total_seconds() > 0 else timedelta(minutes=1)
    timestamps = [start_time, start_time + step, start_time + (step * 2), end_time]
    event_offsets = [timedelta(minutes=1), timedelta(minutes=8), timedelta(minutes=18)]
    event_templates = [
        ("fill", "BTC taker buy fill matched against the replay stream."),
        ("risk_event", "Margin guard flipped to warning during the replay preview."),
        ("bar_close", "The bounded playback window reached its final projected bar close."),
    ]

    timeline = [
        PlaybackTimelinePoint(
            timestamp=timestamp,
            mid_price=f"{64120.0 + (index * 35):.1f}",
            cumulative_events=8 + (index * 14),
        )
        for index, timestamp in enumerate(timestamps)
    ]
    events = [
        PlaybackEventSummary(
            timestamp=min(start_time + offset, end_time),
            event_type=event_type,
            summary=summary,
        )
        for (event_type, summary), offset in zip(event_templates, event_offsets, strict=True)
    ]

    return PlaybackSnapshot(
        generated_at=datetime.now(tz=UTC),
        request=PlaybackRequest(
            request_id="PB-20260327-01",
            catalog_id="primary-parquet",
            instrument_id="BTCUSDT-PERP.BINANCE",
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            speed=speed,
            event_types=["bars", "fills", "risk_events"],
            feedback=f"Playback preview is capped at {limit} projected events across the selected {_format_window(start_time, end_time)} window.",
        ),
        timeline=timeline,
        events=events,
        operator_notes=list(PLAYBACK_OPERATOR_NOTES),
    )
