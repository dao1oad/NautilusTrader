from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_backtests_endpoint_returns_bounded_task_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/backtests")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert payload["items"][0] == {
        "task_id": "BT-20260327-01",
        "run_id": "RUN-20260327-EMA-01",
        "strategy_id": "ema-cross-btc",
        "catalog_id": "primary-parquet",
        "instrument_id": "BTCUSDT-PERP.BINANCE",
        "status": "completed",
        "requested_at": "2026-03-27T08:05:00Z",
        "started_at": "2026-03-27T08:06:00Z",
        "finished_at": "2026-03-27T08:11:00Z",
        "progress_pct": 100,
        "report_id": "REP-20260327-01",
        "result_summary": "Completed 5,842 bars with net PnL +1240.50 USDT and generated report REP-20260327-01.",
    }
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_backtests_endpoint_honors_requested_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/backtests?limit=1")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 1
    assert len(payload["items"]) == 1


def test_backtests_endpoint_rejects_out_of_range_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/backtests?limit=501")

    assert response.status_code == 422
