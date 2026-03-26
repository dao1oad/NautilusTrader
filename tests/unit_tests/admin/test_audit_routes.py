from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_audit_route_returns_recorded_command_history():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/strategies/demo/start")
    assert response.status_code == 202

    audit_response = client.get("/api/admin/audit")
    payload = audit_response.json()

    assert audit_response.status_code == 200
    assert payload["items"][0]["status"] == "completed"
    assert payload["items"][1]["status"] == "accepted"
    assert payload["items"][0]["command"] == "strategy.start"
    assert payload["items"][0]["command_id"] == payload["items"][1]["command_id"]
    assert payload["items"][0]["sequence_id"] > payload["items"][1]["sequence_id"]
