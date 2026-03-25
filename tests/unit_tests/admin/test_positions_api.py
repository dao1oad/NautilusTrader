from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_positions_endpoint_returns_bounded_typed_list_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/positions")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert payload["items"] == []
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_positions_endpoint_honors_requested_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/positions?limit=10")

    assert response.status_code == 200
    assert response.json()["limit"] == 10
