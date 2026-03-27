#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

input_path="workspace/runbooks/issues-snapshot.json"
remote_jobs_path="workspace/runbooks/remote-jobs.json"

usage() {
  cat << 'EOF'
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
    --remote-jobs-path)
      [[ $# -ge 2 ]] || fail "Missing value for --remote-jobs-path"
      remote_jobs_path=$2
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

resolved_input_path=$(resolve_repo_path "$input_path")
resolved_remote_jobs_path=$(resolve_repo_path "$remote_jobs_path")
[[ -f "$resolved_input_path" ]] || fail "Issue snapshot not found: $resolved_input_path"

python3 - "$resolved_input_path" "$resolved_remote_jobs_path" "$repo_root" << 'PY'
import json
import re
import sys
from pathlib import Path

input_path = Path(sys.argv[1])
remote_jobs_path = Path(sys.argv[2])
repo_root = Path(sys.argv[3])

issues = json.loads(input_path.read_text(encoding="utf-8"))
if isinstance(issues, dict):
    issues = [issues]

open_issue_numbers = {str(issue["number"]): True for issue in issues}

if not remote_jobs_path.exists() or not remote_jobs_path.read_text(encoding="utf-8").strip():
    remote_jobs_path.parent.mkdir(parents=True, exist_ok=True)
    remote_jobs_path.write_text('{\n  "version": 1,\n  "jobs": []\n}\n', encoding="utf-8")

remote_registry = json.loads(remote_jobs_path.read_text(encoding="utf-8"))
remote_job_lookup = {}
for job in remote_registry.get("jobs", []):
    issue_number = job.get("issue_number")
    if issue_number is not None:
        remote_job_lookup[str(issue_number)] = job


def get_dependencies(body: str) -> list[str]:
    if not body:
        return []

    body = body.replace("`r`n", "\r\n").replace("`n", "\n").replace("`r", "\r")

    def get_section_issue_references(section_pattern: str) -> list[str]:
        references: list[str] = []
        in_section = False

        for raw_line in body.splitlines():
            line = raw_line.strip()

            if not in_section:
                if re.match(section_pattern, line, re.IGNORECASE):
                    in_section = True
                else:
                    continue
            elif re.match(r"^#+\s+\S+", line):
                break

            if not line:
                continue

            references.extend(re.findall(r"#(\d+)", line))

        return references

    dependencies: list[str] = []
    dependencies.extend(get_section_issue_references(r"^(#+\s*)?Depends on\b"))
    if re.search(r"^(#+\s*)?Phase Close-Out Owned By This Umbrella\b", body, re.IGNORECASE | re.MULTILINE):
        dependencies.extend(get_section_issue_references(r"^(#+\s*)?Child issues\b"))

    return sorted(set(dependencies), key=int)


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


rows = []
for issue in issues:
    labels = list(issue.get("labels", []))
    dependencies = get_dependencies(issue.get("body", ""))
    state = get_issue_state(labels, dependencies)
    remote_job = remote_job_lookup.get(str(issue["number"]), {})
    execution = remote_job.get("execution_status", "idle")
    worker = remote_job.get("worker_host", "TBD")
    job_id = remote_job.get("job_id", "TBD")
    branch = remote_job.get("branch", "TBD")
    pr = f"#{remote_job['pr_number']}" if remote_job.get("pr_number") else "TBD"
    priority = "Medium"
    if "critical" in labels:
        priority = "Critical"
    elif "high" in labels:
        priority = "High"
    elif "low" in labels:
        priority = "Low"

    rows.append(
        {
            "number": issue["number"],
            "title": issue["title"],
            "priority": priority,
            "dependencies": ", ".join(dependencies) if dependencies else "None",
            "state": state,
            "parallel": "Yes" if state == "parallel-ready" else "No",
            "execution": execution,
            "worker": worker,
            "job": job_id,
            "branch": branch,
            "pr": pr,
            "next": (
                "Wait for local execution"
                if execution == "running"
                else "Complete local pre-PR review"
                if execution == "awaiting-local-review"
                else "Inspect local job"
                if execution == "failed"
                else "Resolve dependency"
                if state == "blocked"
                else "Clarify scope"
                if state == "needs-clarification"
                else "Dispatch subagent"
            ),
        },
    )

ledger_lines = [
    "# Issue Ledger",
    "",
    "| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
]

for row in rows:
    ledger_lines.append(
        f"| #{row['number']} | {row['title']} | {row['priority']} | {row['dependencies']} | {row['state']} | {row['parallel']} | {row['execution']} | {row['worker']} | {row['job']} | {row['branch']} | {row['pr']} | {row['next']} |",
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

- Protected main branch
- Shared governance files unless explicitly assigned

## Verification

- Issue-specific tests
- Required smoke checks

## Review Notes

- Local pre-PR review record required before opening PR
"""
    (issue_packets_dir / f"issue-{row['number']}.md").write_text(packet, encoding="utf-8")

print(f"Built issue-ledger and issue-packets for {len(rows)} issues.")
PY
