#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

output_path="workspace/runbooks/issues-snapshot.json"
limit=100

usage() {
  cat <<'EOF'
Usage: scripts/sync-issues.sh [--output-path PATH] [--limit N]
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
    --output-path)
      [[ $# -ge 2 ]] || fail "Missing value for --output-path"
      output_path=$2
      shift 2
      ;;
    --limit)
      [[ $# -ge 2 ]] || fail "Missing value for --limit"
      limit=$2
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

command -v gh >/dev/null 2>&1 || fail "GitHub CLI is required for issue sync."
[[ "$limit" =~ ^[0-9]+$ ]] || fail "--limit must be an integer."

resolved_output_path=$(resolve_repo_path "$output_path")
mkdir -p -- "$(dirname -- "$resolved_output_path")"

raw_json=$(gh issue list --limit "$limit" --state open --json number,title,labels,assignees,milestone,url,body 2>/dev/null || true)
if [[ -z "$raw_json" ]]; then
  raw_json='[]'
fi

tmp_raw_json=$(mktemp)
trap 'rm -f "$tmp_raw_json"' EXIT
printf '%s' "$raw_json" >"$tmp_raw_json"

payload=$(python3 - "$tmp_raw_json" <<'PY'
import json
import sys
from pathlib import Path

data = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
items = json.loads(data or "[]")
normalized = []

for item in items:
    normalized.append(
        {
            "number": item["number"],
            "title": item["title"],
            "url": item["url"],
            "labels": [label["name"] for label in item.get("labels", [])],
            "assignees": [assignee["login"] for assignee in item.get("assignees", [])],
            "milestone": (item.get("milestone") or {}).get("title", ""),
            "body": item.get("body", ""),
        },
    )

json.dump(normalized, sys.stdout, indent=2)
PY
)

printf '%s\n' "$payload" >"$resolved_output_path"

count=$(python3 - "$resolved_output_path" <<'PY'
import json
import sys
from pathlib import Path

print(len(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8") or "[]")))
PY
)

printf 'Synced %s issues to %s\n' "$count" "$resolved_output_path"
