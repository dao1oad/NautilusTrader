from __future__ import annotations

import sys
import types
from pathlib import Path


PACKAGE_NAME = "nautilus_trader"


def _ensure_source_package_stub() -> None:
    if PACKAGE_NAME in sys.modules:
        return

    package_root = Path(__file__).resolve().parents[3] / PACKAGE_NAME
    package = types.ModuleType(PACKAGE_NAME)
    package.__path__ = [str(package_root)]
    package.__file__ = str(package_root / "__init__.py")

    sys.modules[PACKAGE_NAME] = package


_ensure_source_package_stub()
