from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_strategies_endpoint_returns_typed_list_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/strategies")

    assert response.status_code == 200
    payload = response.json()
    assert payload["items"] == []
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload
