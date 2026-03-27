from pathlib import Path

from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def _write_frontend_bundle(bundle_dir: Path) -> str:
    index_markup = """<!doctype html>
<html lang="en">
  <body>
    <div id="root">admin-shell</div>
  </body>
</html>
"""
    assets_dir = bundle_dir / "assets"
    assets_dir.mkdir(parents=True)
    index_file = bundle_dir / "index.html"
    index_file.write_text(index_markup, encoding="utf-8")
    (assets_dir / "app.js").write_text("console.log('admin-shell');\n", encoding="utf-8")
    return index_file.read_text(encoding="utf-8")


def test_static_frontend_root_is_served(tmp_path: Path, monkeypatch) -> None:
    expected_markup = _write_frontend_bundle(tmp_path)
    monkeypatch.setenv("NAUTILUS_ADMIN_FRONTEND_DIR", str(tmp_path))
    client = TestClient(create_admin_app())

    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.text == expected_markup


def test_static_frontend_routes_fall_back_to_index_html(tmp_path: Path, monkeypatch) -> None:
    expected_markup = _write_frontend_bundle(tmp_path)
    monkeypatch.setenv("NAUTILUS_ADMIN_FRONTEND_DIR", str(tmp_path))
    client = TestClient(create_admin_app())

    response = client.get("/orders")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.text == expected_markup


def test_static_frontend_assets_are_served(tmp_path: Path, monkeypatch) -> None:
    _write_frontend_bundle(tmp_path)
    monkeypatch.setenv("NAUTILUS_ADMIN_FRONTEND_DIR", str(tmp_path))
    client = TestClient(create_admin_app())

    response = client.get("/assets/app.js")

    assert response.status_code == 200
    assert response.headers["content-type"].split(";", maxsplit=1)[0] in {
        "application/javascript",
        "text/javascript",
    }
    assert "admin-shell" in response.text
