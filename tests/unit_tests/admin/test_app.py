from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_health_endpoint_returns_ok():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
