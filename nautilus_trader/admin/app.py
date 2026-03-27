from fastapi import FastAPI
from fastapi import Query
from fastapi import WebSocket

from nautilus_trader.admin.schemas import AccountsSnapshot
from nautilus_trader.admin.schemas import AdaptersSnapshot
from nautilus_trader.admin.schemas import AuditSnapshot
from nautilus_trader.admin.schemas import CommandReceipt
from nautilus_trader.admin.schemas import CommandRequest
from nautilus_trader.admin.schemas import ConfigDiffSnapshot
from nautilus_trader.admin.schemas import FillsSnapshot
from nautilus_trader.admin.schemas import HealthStatus
from nautilus_trader.admin.schemas import LogsSnapshot
from nautilus_trader.admin.schemas import NodesSnapshot
from nautilus_trader.admin.schemas import OrdersSnapshot
from nautilus_trader.admin.schemas import OverviewSnapshot
from nautilus_trader.admin.schemas import PositionsSnapshot
from nautilus_trader.admin.schemas import RiskSnapshot
from nautilus_trader.admin.schemas import StrategiesSnapshot
from nautilus_trader.admin.services.accounts import build_accounts_snapshot
from nautilus_trader.admin.services.adapters import build_adapters_snapshot
from nautilus_trader.admin.services.audit import build_audit_snapshot
from nautilus_trader.admin.services.audit import reset_audit_sink
from nautilus_trader.admin.services.commands import reset_command_event_stream
from nautilus_trader.admin.services.commands import submit_command
from nautilus_trader.admin.services.config import build_config_diff_snapshot
from nautilus_trader.admin.services.fills import build_fills_snapshot
from nautilus_trader.admin.services.logs import build_logs_snapshot
from nautilus_trader.admin.services.nodes import build_nodes_snapshot
from nautilus_trader.admin.services.orders import build_orders_snapshot
from nautilus_trader.admin.services.overview import build_overview_snapshot
from nautilus_trader.admin.services.positions import build_positions_snapshot
from nautilus_trader.admin.services.risk import build_risk_snapshot
from nautilus_trader.admin.services.strategies import build_strategies_snapshot
from nautilus_trader.admin.ws import handle_admin_events_socket


DEFAULT_READ_ONLY_LIMIT = 100
MAX_READ_ONLY_LIMIT = 500


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


def _register_read_only_surface_routes(app: FastAPI) -> None:
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

    @app.get("/api/admin/risk", response_model=RiskSnapshot)
    def risk() -> RiskSnapshot:
        return build_risk_snapshot()

    @app.get("/api/admin/logs", response_model=LogsSnapshot)
    def logs(
        limit: int = Query(default=DEFAULT_READ_ONLY_LIMIT, ge=1, le=MAX_READ_ONLY_LIMIT),
        inject_partial_error: bool = False,
    ) -> LogsSnapshot:
        return build_logs_snapshot(limit=limit, inject_partial_error=inject_partial_error)

    @app.get("/api/admin/audit", response_model=AuditSnapshot)
    def audit() -> AuditSnapshot:
        return build_audit_snapshot()

    @app.get("/api/admin/config/diff", response_model=ConfigDiffSnapshot)
    def config_diff() -> ConfigDiffSnapshot:
        return build_config_diff_snapshot()


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


def create_admin_app() -> FastAPI:
    app = FastAPI(title="NautilusTrader Admin API")

    reset_command_event_stream()
    reset_audit_sink()
    _register_core_routes(app)
    _register_read_only_surface_routes(app)
    _register_command_routes(app)
    _register_event_routes(app)

    return app
