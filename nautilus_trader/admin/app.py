from fastapi import FastAPI

from nautilus_trader.admin.schemas import HealthStatus
from nautilus_trader.admin.schemas import OverviewSnapshot
from nautilus_trader.admin.services.overview import build_overview_snapshot


def create_admin_app() -> FastAPI:
    app = FastAPI(title="NautilusTrader Admin API")

    @app.get("/api/admin/health", response_model=HealthStatus)
    def health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.get("/api/admin/overview", response_model=OverviewSnapshot)
    def overview(inject_partial_error: bool = False) -> OverviewSnapshot:
        return build_overview_snapshot(inject_partial_error=inject_partial_error)

    return app
