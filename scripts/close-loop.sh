#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

issue_number=""
pr_number=""
summary="Merge completed."

usage() {
  cat << 'EOF'
Usage: scripts/close-loop.sh [--issue-number N] [--pr-number N] [--summary TEXT]
EOF
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue-number)
      [[ $# -ge 2 ]] || fail "Missing value for --issue-number"
      issue_number=$2
      shift 2
      ;;
    --pr-number)
      [[ $# -ge 2 ]] || fail "Missing value for --pr-number"
      pr_number=$2
      shift 2
      ;;
    --summary)
      [[ $# -ge 2 ]] || fail "Missing value for --summary"
      summary=$2
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      fail "Unknown argument: $1"
      ;;
  esac
done

python3 - "$repo_root" "$issue_number" "$pr_number" "$summary" << 'PY'
import datetime as dt
import sys
from pathlib import Path

repo_root = Path(sys.argv[1])
issue_number = sys.argv[2]
pr_number = sys.argv[3]
summary = sys.argv[4]
date = dt.datetime.now().strftime("%Y-%m-%d")

progress_log = repo_root / "memory/progress-log.md"
active_context = repo_root / "memory/active-context.md"
issue_ledger = repo_root / "memory/issue-ledger.md"

with progress_log.open("a", encoding="utf-8") as fh:
    fh.write(f"\n## {date}\n\n- {summary}\n")

with active_context.open("a", encoding="utf-8") as fh:
    fh.write(f"\n## Last Merge Update\n\n- {date}: {summary}\n")

if issue_number:
    lines = issue_ledger.read_text(encoding="utf-8").splitlines()
    match_prefix = f"| #{issue_number} |"
    found = False
    updated_lines: list[str] = []

    for line in lines:
        if line.startswith(match_prefix):
            found = True
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if len(cells) >= 12:
                updated_lines.append(
                    f"| {cells[0]} | {cells[1]} | {cells[2]} | {cells[3]} | merged | {cells[5]} | merged | {cells[7]} | {cells[8]} | {cells[9]} | #{pr_number} | Archived |",
                )
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)

    if found:
        issue_ledger.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")
    else:
        with issue_ledger.open("a", encoding="utf-8") as fh:
            fh.write(f"\n| #{issue_number} | Closed issue | Medium | None | merged | No | merged | local | n/a | n/a | #{pr_number} | Archived |\n")

print("Updated progress-log, active-context, and issue-ledger.")
PY
