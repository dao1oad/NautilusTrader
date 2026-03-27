from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_accounts_endpoint_returns_bounded_typed_list_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/accounts")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert payload["summary"] == {
        "active_accounts": 2,
        "total_equity": "1842500.00",
        "available_cash": "905000.00",
        "margin_used": "612500.00",
        "margin_available": "1140000.00",
        "gross_exposure": "4280000.00",
        "net_exposure": "1525000.00",
    }
    assert payload["items"][0]["account_id"] == "BINANCE-UM-FUTURES"
    assert payload["items"][0]["margin_ratio"] == "0.34"
    assert payload["items"][0]["balances"][0]["asset"] == "USDT"
    assert payload["items"][0]["exposures"][0]["instrument_id"] == "BTCUSDT-PERP.BINANCE"
    assert payload["items"][0]["alerts"] == ["Margin buffer below target threshold."]
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_accounts_endpoint_honors_requested_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/accounts?limit=50")

    assert response.status_code == 200
    assert response.json()["limit"] == 50


def test_accounts_endpoint_rejects_out_of_range_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/accounts?limit=501")

    assert response.status_code == 422
