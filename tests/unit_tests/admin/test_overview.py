from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_overview_endpoint_returns_typed_empty_state():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/overview")

    assert response.status_code == 200
    payload = response.json()
    assert payload["stale"] is False
    assert payload["partial"] is False
    assert payload["node"]["status"] == "not_configured"
    assert payload["strategies"] == []
    assert payload["adapters"] == []
    assert payload["accounts"] == []
    assert payload["positions"] == []
    assert payload["errors"] == []


def test_overview_endpoint_exposes_partial_failures():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/overview?inject_partial_error=true")

    assert response.status_code == 200
    payload = response.json()
    assert payload["partial"] is True
    assert payload["errors"][0]["section"] == "execution"
