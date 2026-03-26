$required = @(
  'AGENTS.md',
  'prompts\main-agent-startup-prompt.md',
  'scripts\start-main-agent.ps1',
  'scripts\dispatch-issue.ps1'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing main-agent recovery files: " + ($missing -join ', '))
  exit 1
}

$agents = Get-Content 'AGENTS.md' -Raw
$prompt = Get-Content 'prompts\main-agent-startup-prompt.md' -Raw
$start = Get-Content 'scripts\start-main-agent.ps1' -Raw
$dispatch = Get-Content 'scripts\dispatch-issue.ps1' -Raw

if ($agents -notmatch 'continue' -or $agents -notmatch 'failed' -or $agents -notmatch 'retry') {
  Write-Error 'AGENTS.md must document that a generic continuation request can retry a failed local issue run.'
  exit 1
}

if ($prompt -notmatch 'failed' -or $prompt -notmatch 'retry' -or $prompt -notmatch 'Inspect local job') {
  Write-Error 'main-agent-startup-prompt.md must explain how the local main agent should recover and retry a failed issue run.'
  exit 1
}

if ($start -notmatch "Execution -eq 'failed'" -or $start -notmatch 'RecoverFailedRun' -or $start -notmatch 'Retry failed local issue') {
  Write-Error 'start-main-agent.ps1 must detect failed ready issues and re-dispatch them through the recovery path.'
  exit 1
}

if ($dispatch -notmatch '\[switch\]\$RecoverFailedRun' -or $dispatch -notmatch 'worktree remove --force' -or $dispatch -notmatch 'failed local run') {
  Write-Error 'dispatch-issue.ps1 must expose an explicit recovery path that recreates a stale failed worktree before re-dispatch.'
  exit 1
}
