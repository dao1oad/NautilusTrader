from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_catalog_endpoint_returns_bounded_catalog_and_history_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/catalog")

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 100
    assert payload["history_query"] == {
        "catalog_id": "primary-parquet",
        "instrument_id": "BTCUSDT-PERP.BINANCE",
        "data_type": "bars",
        "start_time": "2026-03-27T07:00:00Z",
        "end_time": "2026-03-27T09:00:00Z",
        "limit": 100,
        "returned_rows": 100,
        "feedback": "History query capped at 100 rows across the selected 2 hour window.",
    }
    assert payload["items"][0] == {
        "catalog_id": "primary-parquet",
        "instrument_id": "BTCUSDT-PERP.BINANCE",
        "data_type": "bars",
        "timeframe": "1m",
        "status": "ready",
        "row_count": 18420,
        "first_record_at": "2026-03-26T00:00:00Z",
        "last_record_at": "2026-03-27T09:00:00Z",
    }
    assert payload["operator_notes"] == [
        "Large catalog reads are capped by limit and explicit UTC time range before operators fan out deeper analysis.",
        "Use the paired playback request to preview the same bounded window before replaying events.",
    ]
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_catalog_endpoint_honors_requested_bounds():
    client = TestClient(create_admin_app())

    response = client.get(
        "/api/admin/catalog?limit=50&start_time=2026-03-27T06:30:00Z&end_time=2026-03-27T08:00:00Z",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["limit"] == 50
    assert payload["history_query"]["start_time"] == "2026-03-27T06:30:00Z"
    assert payload["history_query"]["end_time"] == "2026-03-27T08:00:00Z"
    assert payload["history_query"]["limit"] == 50
    assert payload["history_query"]["returned_rows"] == 50
    assert payload["items"][0]["catalog_id"] == "primary-parquet"


def test_catalog_endpoint_rejects_out_of_range_limit():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/catalog?limit=501")

    assert response.status_code == 422


def test_catalog_endpoint_rejects_non_utc_bounds():
    client = TestClient(create_admin_app())

    response = client.get(
        "/api/admin/catalog?start_time=2026-03-27T07:00:00%2B08:00&end_time=2026-03-27T09:00:00%2B08:00",
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "start_time and end_time must be UTC timestamps"}


def test_playback_endpoint_returns_bounded_request_and_preview_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/playback")

    assert response.status_code == 200
    payload = response.json()
    assert payload["request"] == {
        "request_id": "PB-20260327-01",
        "catalog_id": "primary-parquet",
        "instrument_id": "BTCUSDT-PERP.BINANCE",
        "start_time": "2026-03-27T07:30:00Z",
        "end_time": "2026-03-27T08:00:00Z",
        "limit": 100,
        "speed": "25x",
        "event_types": ["bars", "fills", "risk_events"],
        "feedback": "Playback preview is capped at 100 projected events across the selected 30 minute window.",
    }
    assert payload["timeline"][0] == {
        "timestamp": "2026-03-27T07:30:00Z",
        "mid_price": "64120.0",
        "cumulative_events": 8,
    }
    assert payload["events"][0] == {
        "timestamp": "2026-03-27T07:31:00Z",
        "event_type": "fill",
        "summary": "BTC taker buy fill matched against the replay stream.",
    }
    assert payload["operator_notes"] == [
        "Replay requests stay within a bounded UTC window and projected event limit before operators run a full playback job.",
    ]
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_playback_endpoint_honors_requested_bounds():
    client = TestClient(create_admin_app())

    response = client.get(
        "/api/admin/playback?limit=25&start_time=2026-03-27T06:45:00Z&end_time=2026-03-27T07:00:00Z",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["request"]["start_time"] == "2026-03-27T06:45:00Z"
    assert payload["request"]["end_time"] == "2026-03-27T07:00:00Z"
    assert payload["request"]["limit"] == 25


def test_playback_endpoint_rejects_non_utc_bounds():
    client = TestClient(create_admin_app())

    response = client.get(
        "/api/admin/playback?start_time=2026-03-27T07:30:00&end_time=2026-03-27T08:00:00",
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "start_time and end_time must be UTC timestamps"}
