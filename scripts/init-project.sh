#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/.." && pwd)
cd "$repo_root"

project_name=""
repository=""
skip_remote_checks=0

usage() {
  cat <<'EOF'
Usage: scripts/init-project.sh [--project-name NAME] [--repository SLUG] [--skip-remote-checks]
EOF
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

assert_command() {
  local name=$1
  command -v "$name" >/dev/null 2>&1 || fail "Required command not found: $name"
}

append_section_if_missing() {
  local file=$1
  local needle=$2
  local header=$3
  local value=$4

  [[ -f "$file" ]] || return 0

  if ! grep -Fq "$needle" "$file"; then
    printf '\n## %s\n\n- %s\n' "$header" "$value" >>"$file"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-name)
      [[ $# -ge 2 ]] || fail "Missing value for --project-name"
      project_name=$2
      shift 2
      ;;
    --repository)
      [[ $# -ge 2 ]] || fail "Missing value for --repository"
      repository=$2
      shift 2
      ;;
    --skip-remote-checks)
      skip_remote_checks=1
      shift
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

assert_command git
assert_command gh

gh auth status >/dev/null

printf 'Bootstrap checks passed.\n'

if [[ -n "$project_name" ]]; then
  append_section_if_missing "memory/product-context.md" "$project_name" "Project Name" "$project_name"
fi

if [[ -n "$repository" ]]; then
  append_section_if_missing "memory/active-context.md" "$repository" "Repository" "$repository"
fi

printf 'Remote hardening checklist:\n'
printf '%s\n' '- Enable branch protection on main'
printf '%s\n' '- Require pull request before merge'
printf '%s\n' '- Require required checks'
printf '%s\n' '- Require remote Codex review'
printf '%s\n' '- Bind ops/doc-truth-registry.yaml to the project truth documents'
printf '%s\n' '- Bind ops/doc-truth-map.yaml to the project code layout'

if [[ "$skip_remote_checks" -eq 0 ]]; then
  printf 'Run scripts/check-governance.sh after binding the GitHub repository.\n'
fi
