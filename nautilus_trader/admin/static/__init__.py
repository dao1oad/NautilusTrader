from __future__ import annotations

import os
from pathlib import Path


ADMIN_FRONTEND_DIR_ENV_VAR = "NAUTILUS_ADMIN_FRONTEND_DIR"


def _iter_bundle_candidates() -> list[Path]:
    package_bundle_dir = Path(__file__).resolve().parent
    repo_bundle_dir = Path(__file__).resolve().parents[3] / "apps" / "admin-web" / "dist"
    configured_bundle_dir = os.getenv(ADMIN_FRONTEND_DIR_ENV_VAR)

    candidates: list[Path] = []
    if configured_bundle_dir:
        candidates.append(Path(configured_bundle_dir).expanduser())

    candidates.extend([package_bundle_dir, repo_bundle_dir])
    return candidates


def resolve_admin_frontend_dir() -> Path | None:
    seen: set[Path] = set()

    for candidate in _iter_bundle_candidates():
        resolved_candidate = candidate.resolve()
        if resolved_candidate in seen:
            continue

        seen.add(resolved_candidate)
        if (resolved_candidate / "index.html").is_file():
            return resolved_candidate

    return None
