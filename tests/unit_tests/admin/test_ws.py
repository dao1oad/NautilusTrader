from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_ws_accepts_overview_subscription():
    client = TestClient(create_admin_app())

    with client.websocket_connect("/ws/admin/events") as websocket:
        websocket.send_json({"type": "subscribe", "channels": ["overview"]})
        payload = websocket.receive_json()

    assert payload["type"] == "subscribed"
    assert payload["channels"] == ["overview"]


def test_ws_rejects_unknown_channel():
    client = TestClient(create_admin_app())

    with client.websocket_connect("/ws/admin/events") as websocket:
        websocket.send_json({"type": "subscribe", "channels": ["orders"]})
        payload = websocket.receive_json()

    assert payload["type"] == "server.error"
    assert payload["code"] == "unsupported_channel"
