from fastapi import FastAPI
from fastapi import WebSocket

from nautilus_trader.admin.schemas import AdaptersSnapshot
from nautilus_trader.admin.schemas import HealthStatus
from nautilus_trader.admin.schemas import NodesSnapshot
from nautilus_trader.admin.schemas import OverviewSnapshot
from nautilus_trader.admin.schemas import StrategiesSnapshot
from nautilus_trader.admin.services.adapters import build_adapters_snapshot
from nautilus_trader.admin.services.nodes import build_nodes_snapshot
from nautilus_trader.admin.services.overview import build_overview_snapshot
from nautilus_trader.admin.services.strategies import build_strategies_snapshot
from nautilus_trader.admin.ws import handle_admin_events_socket


def create_admin_app() -> FastAPI:
    app = FastAPI(title="NautilusTrader Admin API")

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

    @app.websocket("/ws/admin/events")
    async def admin_events(websocket: WebSocket) -> None:
        await handle_admin_events_socket(websocket)

    return app
