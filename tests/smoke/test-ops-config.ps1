$required = @(
  'ops\project-policy.yaml',
  'ops\agent-config.yaml',
  'ops\issue-board.yaml',
  'ops\review-gates.yaml',
  'ops\bootstrap-checklist.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing ops files: " + ($missing -join ', '))
  exit 1
}

$policy = Get-Content 'ops\project-policy.yaml' -Raw
if ($policy -notmatch 'enforce_pull_request_only:\s*true' -or $policy -notmatch 'require_local_pr_review:\s*true') {
  Write-Error 'project-policy.yaml must enforce PR-only merge and local PR review.'
  exit 1
}
