from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_diagnostics_endpoint_returns_summary_link_health_and_query_timing_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/diagnostics")

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"] == {
        "overall_status": "degraded",
        "healthy_links": 2,
        "degraded_links": 1,
        "slow_queries": 1,
        "latest_catalog_sync_at": "2026-03-27T09:01:00Z",
    }
    assert payload["links"][0] == {
        "link_id": "catalog-primary",
        "label": "Primary parquet catalog",
        "status": "healthy",
        "latency_ms": 42,
        "last_checked_at": "2026-03-27T09:02:00Z",
        "detail": "Heartbeat within the 100 ms operator budget.",
    }
    assert payload["query_timings"][0] == {
        "query_id": "catalog-history-btc",
        "surface": "catalog",
        "status": "slow",
        "limit": 100,
        "window_start": "2026-03-27T07:00:00Z",
        "window_end": "2026-03-27T09:00:00Z",
        "returned_rows": 100,
        "duration_ms": 1480,
        "detail": "Catalog scan hit the operator warning threshold but remained bounded.",
    }
    assert payload["partial"] is False
    assert payload["errors"] == []
    assert "generated_at" in payload


def test_diagnostics_endpoint_surfaces_partial_errors_explicitly():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/diagnostics?inject_partial_error=true")

    assert response.status_code == 200
    payload = response.json()
    assert payload["partial"] is True
    assert payload["summary"] == {
        "overall_status": "partial",
        "healthy_links": 1,
        "degraded_links": 2,
        "slow_queries": 1,
        "latest_catalog_sync_at": "2026-03-27T09:01:00Z",
    }
    assert payload["errors"] == [
        {
            "section": "diagnostics.links",
            "message": "Primary catalog heartbeat timed out while refreshing diagnostics.",
        },
    ]
    assert payload["links"][0] == {
        "link_id": "catalog-primary",
        "label": "Primary parquet catalog",
        "status": "degraded",
        "latency_ms": 480,
        "last_checked_at": "2026-03-27T09:02:00Z",
        "detail": "Primary catalog heartbeat timed out while refreshing diagnostics.",
    }
    assert payload["links"][1]["status"] == "degraded"
