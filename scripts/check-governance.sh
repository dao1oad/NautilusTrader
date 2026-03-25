#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

skip_remote_checks=0

usage() {
  cat << 'EOF'
Usage: scripts/check-governance.sh [--skip-remote-checks]
EOF
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

get_config_value() {
  python3 - "$1" "$2" << 'PY'
import re
import sys

path, key = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as fh:
    content = fh.read()

match = re.search(rf"(?m)^\s*{re.escape(key)}:\s*([^\r\n#]+)", content)
print(match.group(1).strip() if match else "")
PY
}

get_config_boolean() {
  local value
  value=$(get_config_value "$1" "$2")
  if [[ "${value,,}" == "true" ]]; then
    printf 'true\n'
  else
    printf 'false\n'
  fi
}

get_config_int() {
  local path=$1
  local key=$2
  local default_value=${3:-0}
  local value

  value=$(get_config_value "$path" "$key")
  if [[ -z "$value" ]]; then
    printf '%s\n' "$default_value"
    return 0
  fi

  [[ "$value" =~ ^-?[0-9]+$ ]] || fail "Configuration key '$key' in '$path' must be an integer."
  printf '%s\n' "$value"
}

get_config_list() {
  python3 - "$1" "$2" << 'PY'
import re
import sys

path, key = sys.argv[1], sys.argv[2]
lines = open(path, encoding="utf-8").read().splitlines()
capture = False

for line in lines:
    if capture:
        match = re.match(r"^\s*-\s*(.+)$", line)
        if match:
            print(match.group(1).strip())
            continue
        if re.match(r"^\S", line) or re.match(r"^[A-Za-z0-9_-]+:", line):
            break

    if re.match(rf"^\s*{re.escape(key)}:\s*$", line):
        capture = True
PY
}

get_required_truth_paths() {
  python3 - "$1" << 'PY'
import re
import sys

path = sys.argv[1]
documents = []
current = None

for line in open(path, encoding="utf-8").read().splitlines():
    role_match = re.match(r"^\s*-\s*role:\s*(.+)$", line)
    if role_match:
        if current is not None:
            documents.append(current)
        current = {"path": "", "required": True}
        continue

    if current is None:
        continue

    path_match = re.match(r"^\s*path:\s*(.+)$", line)
    if path_match:
        current["path"] = path_match.group(1).strip()
        continue

    required_match = re.match(r"^\s*required:\s*(true|false)\s*$", line)
    if required_match:
        current["required"] = required_match.group(1).strip().lower() == "true"

if current is not None:
    documents.append(current)

for item in documents:
    if item["required"] and item["path"]:
        print(item["path"])
PY
}

get_truth_map_rule_count() {
  python3 - "$1" << 'PY'
import re
import sys

path = sys.argv[1]
capture = False
count = 0

for line in open(path, encoding="utf-8").read().splitlines():
    if not capture:
        if re.match(r"^\s*rules:\s*$", line):
            capture = True
        continue

    if re.match(r"^\s*-\s*name:\s*(.+)$", line):
        count += 1

print(count)
PY
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-remote-checks)
      skip_remote_checks=1
      shift
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

required_files=(
  "AGENTS.md"
  "ops/project-policy.yaml"
  "ops/agent-config.yaml"
  "ops/review-gates.yaml"
  "memory/active-context.md"
  "memory/issue-ledger.md"
  ".github/PULL_REQUEST_TEMPLATE.md"
  "workspace/handoffs/local-review-template.md"
)

missing=()
for path in "${required_files[@]}"; do
[[ -e "$path" ]] || missing+=("$path")
done

if [[ ${#missing[@]} -gt 0 ]]; then
  fail "Missing governance files: ${missing[*]}"
fi

policy_path="ops/project-policy.yaml"
[[ $(get_config_boolean "$policy_path" "enforce_pull_request_only") == "true" ]] || fail "project-policy.yaml must enable PR-only merge."
[[ $(get_config_boolean "$policy_path" "require_local_pr_review") == "true" ]] || fail "project-policy.yaml must require local PR review."

if [[ $(get_config_boolean "$policy_path" "require_truth_docs") == "true" ]]; then
  truth_required=(
    "governance/documentation-truth-policy.md"
    "docs/system-truth/index.md"
    "ops/doc-truth-registry.yaml"
    "ops/doc-truth-map.yaml"
  )

  missing_truth=()
  for path in "${truth_required[@]}"; do
    [[ -e "$path" ]] || missing_truth+=("$path")
  done

  if [[ ${#missing_truth[@]} -gt 0 ]]; then
    fail "Missing truth-doc governance files: ${missing_truth[*]}"
  fi

  mapfile -t truth_registry_paths < <(get_required_truth_paths "ops/doc-truth-registry.yaml")
  [[ ${#truth_registry_paths[@]} -gt 0 ]] || fail "doc-truth-registry.yaml must declare at least one truth document."

  for path in "${truth_registry_paths[@]}"; do
    [[ -e "$path" ]] || fail "Required truth document is missing: $path"
  done

  truth_map_rule_count=$(get_truth_map_rule_count "ops/doc-truth-map.yaml")
  [[ "$truth_map_rule_count" =~ ^[0-9]+$ ]] || fail "doc-truth-map.yaml must declare at least one mapping rule."
  ((truth_map_rule_count > 0)) || fail "doc-truth-map.yaml must declare at least one mapping rule."

  [[ $(get_config_boolean "$policy_path" "fail_on_unmapped_production_paths") == "true" ]] || fail "Truth-doc governance must fail on unmapped production paths by default."
fi

if [[ "$skip_remote_checks" -eq 1 ]]; then
  printf 'Local governance checks passed. Remote branch protection checks skipped.\n'
  exit 0
fi

remote_url=$(git remote get-url origin 2> /dev/null || true)
[[ -n "$remote_url" ]] || fail "Git remote origin is not configured. Cannot verify branch protection."

command -v gh > /dev/null 2>&1 || fail "GitHub CLI is required to verify remote branch protection."

repo_slug=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2> /dev/null || true)
[[ -n "$repo_slug" ]] || fail "Unable to resolve repository slug via gh."

branch_protection_endpoint="repos/$repo_slug/branches/main/protection"
if ! gh api "$branch_protection_endpoint" > /dev/null 2>&1; then
  fail "Remote branch protection is not configured or cannot be read. Verify branch protection on main."
fi

required_pr_reviews_present=$(gh api "$branch_protection_endpoint" --jq '.required_pull_request_reviews != null')
[[ "$required_pr_reviews_present" == "true" ]] || fail "Remote protection must require pull request reviews."

expected_approving_review_count=$(get_config_int "ops/review-gates.yaml" "required_approving_review_count" "1")
((expected_approving_review_count >= 0)) || fail "Configured required_approving_review_count must be 0 or greater."

actual_approving_review_count=$(gh api "$branch_protection_endpoint" --jq '.required_pull_request_reviews.required_approving_review_count // -1')
[[ "$actual_approving_review_count" =~ ^-?[0-9]+$ ]] || fail "Unable to read remote required approving review count."
((actual_approving_review_count >= expected_approving_review_count)) || fail "Remote protection must require at least $expected_approving_review_count approving review(s)."

required_status_checks_present=$(gh api "$branch_protection_endpoint" --jq '.required_status_checks != null')
[[ "$required_status_checks_present" == "true" ]] || fail "Remote protection must require status checks."

mapfile -t actual_status_checks < <(
  {
    gh api "$branch_protection_endpoint" --jq '.required_status_checks.contexts[]?' 2> /dev/null || true
    gh api "$branch_protection_endpoint" --jq '.required_status_checks.checks[]? | (.context // .name // empty)' 2> /dev/null || true
  } | awk 'NF' | sort -u
)

[[ ${#actual_status_checks[@]} -gt 0 ]] || fail "Remote protection must define at least one required status check."

mapfile -t expected_status_checks < <(get_config_list "ops/review-gates.yaml" "required_status_checks")
for expected_check in "${expected_status_checks[@]}"; do
  found=0
  for actual_check in "${actual_status_checks[@]}"; do
    if [[ "$actual_check" == "$expected_check" ]]; then
      found=1
      break
    fi
  done

  ((found == 1)) || fail "Remote protection is missing required status check '$expected_check'."
done

required_conversation_resolution=$(gh api "$branch_protection_endpoint" --jq '.required_conversation_resolution.enabled // false')
[[ "$required_conversation_resolution" == "true" ]] || fail "Remote protection must enable required conversation resolution."

allow_force_pushes=$(gh api "$branch_protection_endpoint" --jq '.allow_force_pushes.enabled // false')
[[ "$allow_force_pushes" == "false" ]] || fail "Remote protection must disable force pushes."

enforce_admins=$(gh api "$branch_protection_endpoint" --jq '.enforce_admins.enabled // false')
[[ "$enforce_admins" == "true" ]] || fail "Remote protection must enforce protections for admins."

bypass_count=$(gh api "$branch_protection_endpoint" --jq '[.required_pull_request_reviews.bypass_pull_request_allowances.users // [], .required_pull_request_reviews.bypass_pull_request_allowances.teams // [], .required_pull_request_reviews.bypass_pull_request_allowances.apps // []] | flatten | length')
[[ "$bypass_count" =~ ^[0-9]+$ ]] || fail "Unable to read remote bypass allowances."
((bypass_count == 0)) || fail "Remote protection must not grant bypass_pull_request_allowances."

printf 'Local governance files and remote branch protection checks passed.\n'
