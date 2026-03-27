from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_reports_endpoint_returns_bounded_summary_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/reports")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert payload["items"][0] == {
        "report_id": "REP-20260327-01",
        "run_id": "RUN-20260327-EMA-01",
        "strategy_id": "ema-cross-btc",
        "instrument_id": "BTCUSDT-PERP.BINANCE",
        "generated_at": "2026-03-27T08:12:00Z",
        "net_pnl": "+1240.50 USDT",
        "return_pct": "+3.8%",
        "max_drawdown": "-0.9%",
        "sharpe_ratio": "1.84",
        "win_rate": "58%",
        "artifacts": ["orders", "fills", "positions", "account"],
        "summary": "Orders, fills, positions, and account reports are ready for operator review.",
    }
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_reports_endpoint_honors_requested_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/reports?limit=1")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 1
    assert len(payload["items"]) == 1


def test_reports_endpoint_rejects_out_of_range_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/reports?limit=501")

    assert response.status_code == 422
