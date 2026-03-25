from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_logs_endpoint_returns_bounded_typed_list_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/logs")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert payload["items"] == []
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_logs_endpoint_surfaces_partial_errors_explicitly():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/logs?inject_partial_error=true")

    assert response.status_code == 200
    payload = response.json()
    assert payload["partial"] is True
    assert payload["errors"] == [
        {
            "section": "logs",
            "message": "Injected partial failure for admin logs testing.",
        },
    ]
