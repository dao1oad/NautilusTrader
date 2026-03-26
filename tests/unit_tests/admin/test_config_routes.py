from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_config_diff_route_returns_phase_2_guardrails_and_runbooks():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/config/diff")
    payload = response.json()

    assert response.status_code == 200
    assert payload["items"][0]["key"] == "command.confirmation.required"
    assert payload["items"][0]["status"] == "in_sync"
    assert payload["items"][1]["key"] == "high_risk_commands.enabled"
    assert payload["items"][1]["actual"] == "disabled"
    assert payload["runbooks"][0]["runbook_id"] == "verify-command-guardrails"
