from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_subscription_subscribe_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/subscriptions/BTC-USD/subscribe")

    assert response.status_code == 202
    payload = response.json()
    assert payload["command"] == "subscription.subscribe"
    assert payload["target"] == "subscriptions/BTC-USD"
    assert payload["status"] == "accepted"


def test_subscription_unsubscribe_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/subscriptions/BTC-USD/unsubscribe")

    assert response.status_code == 202
    payload = response.json()
    assert payload["command"] == "subscription.unsubscribe"
    assert payload["target"] == "subscriptions/BTC-USD"
    assert payload["status"] == "accepted"
