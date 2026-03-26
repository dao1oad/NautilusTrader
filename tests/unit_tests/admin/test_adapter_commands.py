from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_adapter_connect_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/adapters/ib/connect")

    assert response.status_code == 202
    payload = response.json()
    assert payload["command"] == "adapter.connect"
    assert payload["target"] == "adapters/ib"
    assert payload["status"] == "accepted"


def test_adapter_disconnect_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/adapters/ib/disconnect")

    assert response.status_code == 202
    payload = response.json()
    assert payload["command"] == "adapter.disconnect"
    assert payload["target"] == "adapters/ib"
    assert payload["status"] == "accepted"
