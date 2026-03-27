from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_fills_endpoint_returns_paginated_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/fills")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert "items" in payload
    assert "generated_at" in payload


def test_fills_endpoint_honors_requested_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/fills?limit=25")

    assert response.status_code == 200
    assert response.json()["limit"] == 25


def test_fills_endpoint_rejects_out_of_range_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/fills?limit=501")

    assert response.status_code == 422
