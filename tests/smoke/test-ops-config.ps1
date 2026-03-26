$required = @(
  'ops\project-policy.yaml',
  'ops\agent-config.yaml',
  'ops\issue-board.yaml',
  'ops\review-gates.yaml',
  'ops\bootstrap-checklist.md',
  'ops\remote-execution.yaml'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing ops files: " + ($missing -join ', '))
  exit 1
}

$policy = Get-Content 'ops\project-policy.yaml' -Raw
if ($policy -notmatch 'enforce_pull_request_only:\s*true' -or $policy -notmatch 'require_local_pre_pr_review:\s*true') {
  Write-Error 'project-policy.yaml must enforce PR-only merge and local pre-PR review.'
  exit 1
}

$agentConfig = Get-Content 'ops\agent-config.yaml' -Raw
if ($agentConfig -match 'execution:\s*codex_cloud' -or $agentConfig -notmatch 'subagent:\s*(?:\r?\n)+\s+execution:\s*local') {
  Write-Error 'agent-config.yaml must describe pure local execution for bounded subagent work.'
  exit 1
}

$remote = Get-Content 'ops\remote-execution.yaml' -Raw
if ($remote -notmatch 'enabled:\s*true' -or $remote -notmatch 'worker:' -or $remote -notmatch 'observability:') {
  Write-Error 'remote-execution.yaml must enable local execution and declare worker plus observability settings.'
  exit 1
}
