#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

input_path="workspace/runbooks/issues-snapshot.json"

usage() {
  cat <<'EOF'
Usage: scripts/build-workset.sh [--input-path PATH]
EOF
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

resolve_repo_path() {
  local path=$1
  if [[ "$path" = /* ]]; then
    printf '%s\n' "$path"
  else
    printf '%s\n' "$repo_root/$path"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input-path)
      [[ $# -ge 2 ]] || fail "Missing value for --input-path"
      input_path=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      fail "Unknown argument: $1"
      ;;
  esac
done

resolved_input_path=$(resolve_repo_path "$input_path")
[[ -f "$resolved_input_path" ]] || fail "Issue snapshot not found: $resolved_input_path"

python3 - "$resolved_input_path" "$repo_root" <<'PY'
import json
import re
import sys
from pathlib import Path

input_path = Path(sys.argv[1])
repo_root = Path(sys.argv[2])

issues = json.loads(input_path.read_text(encoding="utf-8"))
if isinstance(issues, dict):
    issues = [issues]

open_issue_numbers = {str(issue["number"]): True for issue in issues}
default_next_values = {
    "Resolve dependency",
    "Clarify scope",
    "Dispatch subagent",
}


def load_existing_issue_metadata(ledger_path: Path) -> dict[str, dict[str, str]]:
    if not ledger_path.exists():
        return {}

    metadata: dict[str, dict[str, str]] = {}
    for line in ledger_path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("| #"):
            continue

        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 8:
            continue

        match = re.fullmatch(r"#(\d+)", cells[0])
        if not match:
            continue

        metadata[match.group(1)] = {
            "pr": cells[6],
            "next": cells[7],
        }

    return metadata


def get_dependencies(body: str) -> list[str]:
    if not body:
        return []
    return sorted(set(re.findall(r"#(\d+)", body)))


def get_issue_state(labels: list[str], dependencies: list[str]) -> str:
    if any(dependency in open_issue_numbers for dependency in dependencies):
        return "blocked"
    if "blocked" in labels:
        return "blocked"
    if "needs-clarification" in labels:
        return "needs-clarification"
    if "parallel-ready" in labels:
        return "parallel-ready"
    return "ready"


existing_issue_metadata = load_existing_issue_metadata(repo_root / "memory/issue-ledger.md")

rows = []
for issue in issues:
    labels = list(issue.get("labels", []))
    dependencies = get_dependencies(issue.get("body", ""))
    state = get_issue_state(labels, dependencies)
    priority = "Medium"
    if "critical" in labels:
        priority = "Critical"
    elif "high" in labels:
        priority = "High"
    elif "low" in labels:
        priority = "Low"

    default_next = (
        "Resolve dependency"
        if state == "blocked"
        else "Clarify scope"
        if state == "needs-clarification"
        else "Dispatch subagent"
    )
    existing = existing_issue_metadata.get(str(issue["number"]), {})
    pr = existing.get("pr", "TBD")
    if not pr:
        pr = "TBD"

    next_value = default_next
    existing_next = existing.get("next", "")
    if (
        state in {"ready", "parallel-ready"}
        and existing_next
        and existing_next not in default_next_values
    ):
        next_value = existing_next

    rows.append(
        {
            "number": issue["number"],
            "title": issue["title"],
            "priority": priority,
            "dependencies": ", ".join(dependencies) if dependencies else "None",
            "state": state,
            "parallel": "Yes" if state == "parallel-ready" else "No",
            "pr": pr if pr != "TBD" else "TBD",
            "next": next_value,
        },
    )

ledger_lines = [
    "# Issue Ledger",
    "",
    "| Issue | Title | Priority | Dependencies | State | Parallel | PR | Next |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
]

for row in rows:
    ledger_lines.append(
        f"| #{row['number']} | {row['title']} | {row['priority']} | {row['dependencies']} | {row['state']} | {row['parallel']} | {row['pr']} | {row['next']} |",
    )

ledger_path = repo_root / "memory/issue-ledger.md"
ledger_path.write_text("\n".join(ledger_lines) + "\n", encoding="utf-8")

issue_packets_dir = repo_root / "workspace/issue-packets"
issue_packets_dir.mkdir(parents=True, exist_ok=True)
for path in issue_packets_dir.glob("*.md"):
    path.unlink()

for row in rows:
    packet = f"""# Issue Packet: #{row['number']}

## Issue

- ID: {row['number']}
- Title: {row['title']}
- Priority: {row['priority']}
- Dependencies: {row['dependencies']}

## Goal

Resolve GitHub issue #{row['number']} according to repository policy.

## Constraints

- Follow AGENTS.md
- Respect issue-ledger state
- Do not violate pull-request-only merge policy

## Allowed Write Scope

- Determined by main agent before dispatch

## Forbidden Scope

- Remote main branch
- Shared governance files unless explicitly assigned

## Verification

- Issue-specific tests
- Required smoke checks

## Review Notes

- Remote Codex review required before merge
"""
    (issue_packets_dir / f"issue-{row['number']}.md").write_text(packet, encoding="utf-8")

print(f"Built issue-ledger and issue-packets for {len(rows)} issues.")
PY
