from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_risk_endpoint_returns_summary_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/risk")

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"] == {
        "trading_state": "reducing",
        "risk_level": "elevated",
        "margin_utilization": "0.54",
        "exposure_utilization": "0.67",
        "active_alerts": 2,
        "blocked_actions": 1,
    }
    assert payload["events"][0]["event_id"] == "margin-buffer-warning"
    assert payload["events"][0]["severity"] == "warn"
    assert payload["blocks"][0] == {
        "block_id": "reduce-only-btc",
        "scope": "orders/BTCUSDT-PERP.BINANCE",
        "reason": "Reduce-only guard enabled while the margin cushion recovers.",
        "status": "active",
        "raised_at": "2026-03-27T08:57:00Z",
    }
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload
