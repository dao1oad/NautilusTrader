from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_strategy_start_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/strategies/demo/start")

    assert response.status_code == 202
    payload = response.json()
    assert payload["command"] == "strategy.start"
    assert payload["target"] == "strategies/demo"
    assert payload["status"] == "accepted"
    assert payload["message"] == "Command queued for local strategy.start."


def test_strategy_stop_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/strategies/demo/stop")

    assert response.status_code == 202
    payload = response.json()
    assert payload["command"] == "strategy.stop"
    assert payload["target"] == "strategies/demo"
    assert payload["status"] == "accepted"
