from datetime import datetime
from datetime import timedelta
from pathlib import Path

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Query
from fastapi import WebSocket
from fastapi.responses import FileResponse

from nautilus_trader.admin.schemas import AccountsSnapshot
from nautilus_trader.admin.schemas import AdaptersSnapshot
from nautilus_trader.admin.schemas import AuditSnapshot
from nautilus_trader.admin.schemas import BacktestsSnapshot
from nautilus_trader.admin.schemas import CatalogSnapshot
from nautilus_trader.admin.schemas import CommandReceipt
from nautilus_trader.admin.schemas import CommandRequest
from nautilus_trader.admin.schemas import ConfigDiffSnapshot
from nautilus_trader.admin.schemas import DiagnosticsSnapshot
from nautilus_trader.admin.schemas import FillsSnapshot
from nautilus_trader.admin.schemas import HealthStatus
from nautilus_trader.admin.schemas import LogsSnapshot
from nautilus_trader.admin.schemas import NodesSnapshot
from nautilus_trader.admin.schemas import OrdersSnapshot
from nautilus_trader.admin.schemas import OverviewSnapshot
from nautilus_trader.admin.schemas import PlaybackSnapshot
from nautilus_trader.admin.schemas import PositionsSnapshot
from nautilus_trader.admin.schemas import ReportsSnapshot
from nautilus_trader.admin.schemas import RiskSnapshot
from nautilus_trader.admin.schemas import StrategiesSnapshot
from nautilus_trader.admin.services.accounts import build_accounts_snapshot
from nautilus_trader.admin.services.adapters import build_adapters_snapshot
from nautilus_trader.admin.services.audit import build_audit_snapshot
from nautilus_trader.admin.services.audit import reset_audit_sink
from nautilus_trader.admin.services.backtests import build_backtests_snapshot
from nautilus_trader.admin.services.catalog import DEFAULT_CATALOG_END_TIME
from nautilus_trader.admin.services.catalog import DEFAULT_CATALOG_START_TIME
from nautilus_trader.admin.services.catalog import DEFAULT_PLAYBACK_END_TIME
from nautilus_trader.admin.services.catalog import DEFAULT_PLAYBACK_START_TIME
from nautilus_trader.admin.services.catalog import build_catalog_snapshot
from nautilus_trader.admin.services.catalog import build_playback_snapshot
from nautilus_trader.admin.services.commands import reset_command_event_stream
from nautilus_trader.admin.services.commands import submit_command
from nautilus_trader.admin.services.config import build_config_diff_snapshot
from nautilus_trader.admin.services.diagnostics import build_diagnostics_snapshot
from nautilus_trader.admin.services.fills import build_fills_snapshot
from nautilus_trader.admin.services.logs import build_logs_snapshot
from nautilus_trader.admin.services.nodes import build_nodes_snapshot
from nautilus_trader.admin.services.orders import build_orders_snapshot
from nautilus_trader.admin.services.overview import build_overview_snapshot
from nautilus_trader.admin.services.positions import build_positions_snapshot
from nautilus_trader.admin.services.reports import build_reports_snapshot
from nautilus_trader.admin.services.risk import build_risk_snapshot
from nautilus_trader.admin.services.strategies import build_strategies_snapshot
from nautilus_trader.admin.static import resolve_admin_frontend_dir
from nautilus_trader.admin.ws import handle_admin_events_socket


DEFAULT_READ_ONLY_LIMIT = 100
MAX_READ_ONLY_LIMIT = 500
RESERVED_FRONTEND_PREFIXES = ("api", "ws")


def _validate_time_window(*, start_time: datetime, end_time: datetime) -> None:
    if start_time.tzinfo is None or end_time.tzinfo is None:
        raise HTTPException(
            status_code=422,
            detail="start_time and end_time must be UTC timestamps",
        )

    if start_time.utcoffset() != timedelta(0) or end_time.utcoffset() != timedelta(0):
        raise HTTPException(
            status_code=422,
            detail="start_time and end_time must be UTC timestamps",
        )

    if end_time <= start_time:
        raise HTTPException(status_code=422, detail="end_time must be greater than start_time")


def _register_core_routes(app: FastAPI) -> None:
    @app.get("/api/admin/health", response_model=HealthStatus)
    def health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.get("/api/admin/overview", response_model=OverviewSnapshot)
    def overview(inject_partial_error: bool = False) -> OverviewSnapshot:
        return build_overview_snapshot(inject_partial_error=inject_partial_error)

    @app.get("/api/admin/nodes", response_model=NodesSnapshot)
    def nodes() -> NodesSnapshot:
        return build_nodes_snapshot()

    @app.get("/api/admin/strategies", response_model=StrategiesSnapshot)
    def strategies() -> StrategiesSnapshot:
        return build_strategies_snapshot()

    @app.get("/api/admin/adapters", response_model=AdaptersSnapshot)
    def adapters() -> AdaptersSnapshot:
        return build_adapters_snapshot()


def _register_activity_snapshot_routes(app: FastAPI) -> None:
    @app.get("/api/admin/orders", response_model=OrdersSnapshot)
    def orders(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
    ) -> OrdersSnapshot:
        return build_orders_snapshot(limit=limit)

    @app.get("/api/admin/fills", response_model=FillsSnapshot)
    def fills(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
    ) -> FillsSnapshot:
        return build_fills_snapshot(limit=limit)

    @app.get("/api/admin/positions", response_model=PositionsSnapshot)
    def positions(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
    ) -> PositionsSnapshot:
        return build_positions_snapshot(limit=limit)

    @app.get("/api/admin/accounts", response_model=AccountsSnapshot)
    def accounts(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
    ) -> AccountsSnapshot:
        return build_accounts_snapshot(limit=limit)


def _register_observability_snapshot_routes(app: FastAPI) -> None:
    @app.get("/api/admin/risk", response_model=RiskSnapshot)
    def risk() -> RiskSnapshot:
        return build_risk_snapshot()

    @app.get("/api/admin/logs", response_model=LogsSnapshot)
    def logs(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
        inject_partial_error: bool = False,
    ) -> LogsSnapshot:
        return build_logs_snapshot(limit=limit, inject_partial_error=inject_partial_error)

    @app.get("/api/admin/diagnostics", response_model=DiagnosticsSnapshot)
    def diagnostics(inject_partial_error: bool = False) -> DiagnosticsSnapshot:
        return build_diagnostics_snapshot(inject_partial_error=inject_partial_error)

    @app.get("/api/admin/audit", response_model=AuditSnapshot)
    def audit() -> AuditSnapshot:
        return build_audit_snapshot()

    @app.get("/api/admin/config/diff", response_model=ConfigDiffSnapshot)
    def config_diff() -> ConfigDiffSnapshot:
        return build_config_diff_snapshot()


def _register_catalog_snapshot_routes(app: FastAPI) -> None:
    @app.get("/api/admin/catalog", response_model=CatalogSnapshot)
    def catalog(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
        start_time: datetime = Query(default=DEFAULT_CATALOG_START_TIME),
        end_time: datetime = Query(default=DEFAULT_CATALOG_END_TIME),
    ) -> CatalogSnapshot:
        _validate_time_window(start_time=start_time, end_time=end_time)
        return build_catalog_snapshot(limit=limit, start_time=start_time, end_time=end_time)

    @app.get("/api/admin/playback", response_model=PlaybackSnapshot)
    def playback(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
        start_time: datetime = Query(default=DEFAULT_PLAYBACK_START_TIME),
        end_time: datetime = Query(default=DEFAULT_PLAYBACK_END_TIME),
    ) -> PlaybackSnapshot:
        _validate_time_window(start_time=start_time, end_time=end_time)
        return build_playback_snapshot(limit=limit, start_time=start_time, end_time=end_time)


def _register_research_snapshot_routes(app: FastAPI) -> None:
    @app.get("/api/admin/backtests", response_model=BacktestsSnapshot)
    def backtests(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
    ) -> BacktestsSnapshot:
        return build_backtests_snapshot(limit=limit)

    @app.get("/api/admin/reports", response_model=ReportsSnapshot)
    def reports(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
    ) -> ReportsSnapshot:
        return build_reports_snapshot(limit=limit)


def _register_read_only_surface_routes(app: FastAPI) -> None:
    _register_activity_snapshot_routes(app)
    _register_observability_snapshot_routes(app)
    _register_catalog_snapshot_routes(app)
    _register_research_snapshot_routes(app)


def _register_event_routes(app: FastAPI) -> None:
    @app.websocket("/ws/admin/events")
    async def admin_events(websocket: WebSocket) -> None:
        await handle_admin_events_socket(websocket)


def _register_command_routes(app: FastAPI) -> None:
    @app.post(
        "/api/admin/commands/strategies/{strategy_id}/start",
        response_model=CommandReceipt,
        status_code=202,
    )
    def start_strategy(strategy_id: str) -> CommandReceipt:
        return submit_command(
            CommandRequest(
                command="strategy.start",
                target=f"strategies/{strategy_id}",
                payload={"strategy_id": strategy_id},
            ),
        )

    @app.post(
        "/api/admin/commands/strategies/{strategy_id}/stop",
        response_model=CommandReceipt,
        status_code=202,
    )
    def stop_strategy(strategy_id: str) -> CommandReceipt:
        return submit_command(
            CommandRequest(
                command="strategy.stop",
                target=f"strategies/{strategy_id}",
                payload={"strategy_id": strategy_id},
            ),
        )

    @app.post(
        "/api/admin/commands/adapters/{adapter_id}/connect",
        response_model=CommandReceipt,
        status_code=202,
    )
    def connect_adapter(adapter_id: str) -> CommandReceipt:
        return submit_command(
            CommandRequest(
                command="adapter.connect",
                target=f"adapters/{adapter_id}",
                payload={"adapter_id": adapter_id},
            ),
        )

    @app.post(
        "/api/admin/commands/adapters/{adapter_id}/disconnect",
        response_model=CommandReceipt,
        status_code=202,
    )
    def disconnect_adapter(adapter_id: str) -> CommandReceipt:
        return submit_command(
            CommandRequest(
                command="adapter.disconnect",
                target=f"adapters/{adapter_id}",
                payload={"adapter_id": adapter_id},
            ),
        )

    @app.post(
        "/api/admin/commands/subscriptions/{instrument_id}/subscribe",
        response_model=CommandReceipt,
        status_code=202,
    )
    def subscribe_market_data(instrument_id: str) -> CommandReceipt:
        return submit_command(
            CommandRequest(
                command="subscription.subscribe",
                target=f"subscriptions/{instrument_id}",
                payload={"instrument_id": instrument_id},
            ),
        )

    @app.post(
        "/api/admin/commands/subscriptions/{instrument_id}/unsubscribe",
        response_model=CommandReceipt,
        status_code=202,
    )
    def unsubscribe_market_data(instrument_id: str) -> CommandReceipt:
        return submit_command(
            CommandRequest(
                command="subscription.unsubscribe",
                target=f"subscriptions/{instrument_id}",
                payload={"instrument_id": instrument_id},
            ),
        )


def _resolve_frontend_asset(frontend_dir: Path, frontend_path: str) -> Path | None:
    requested_path = Path(frontend_path)
    candidate = (frontend_dir / requested_path).resolve()

    try:
        candidate.relative_to(frontend_dir)
    except ValueError:
        return None

    if candidate.is_file():
        return candidate

    return None


def _register_frontend_routes(app: FastAPI) -> None:
    frontend_dir = resolve_admin_frontend_dir()
    if frontend_dir is None:
        return

    frontend_dir = frontend_dir.resolve()
    index_file = frontend_dir / "index.html"

    @app.get("/", include_in_schema=False)
    def frontend_index() -> FileResponse:
        return FileResponse(index_file)

    @app.get("/{frontend_path:path}", include_in_schema=False)
    def frontend_asset(frontend_path: str) -> FileResponse:
        first_segment = frontend_path.split("/", maxsplit=1)[0]
        if first_segment in RESERVED_FRONTEND_PREFIXES:
            raise HTTPException(status_code=404, detail="Not found")

        asset = _resolve_frontend_asset(frontend_dir, frontend_path)
        if asset is not None:
            return FileResponse(asset)

        return FileResponse(index_file)


def create_admin_app() -> FastAPI:
    app = FastAPI(title="NautilusTrader Admin API")

    reset_command_event_stream()
    reset_audit_sink()
    _register_core_routes(app)
    _register_read_only_surface_routes(app)
    _register_command_routes(app)
    _register_event_routes(app)
    _register_frontend_routes(app)

    return app
