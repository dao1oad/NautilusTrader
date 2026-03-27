from __future__ import annotations

import os
import sys
import types
from pathlib import Path

import uvicorn


def _bootstrap_repo_package(repo_root: Path) -> None:
    package_root = repo_root / "nautilus_trader"
    package = types.ModuleType("nautilus_trader")
    package.__path__ = [str(package_root)]
    sys.modules["nautilus_trader"] = package


def main() -> None:
    repo_root = Path(__file__).resolve().parents[4]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    _bootstrap_repo_package(repo_root)

    from nautilus_trader.admin.app import create_admin_app

    uvicorn.run(
        create_admin_app(),
        host="127.0.0.1",
        port=int(os.environ["NAUTILUS_ADMIN_E2E_PORT"]),
        log_level="warning",
    )


if __name__ == "__main__":
    main()
