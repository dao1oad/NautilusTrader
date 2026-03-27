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

if ($agents -notmatch 'continue' -or $agents -notmatch 'failed' -or $agents -notmatch 'retry' -or $agents -notmatch 'running') {
  Write-Error 'AGENTS.md must document that a generic continuation request can retry a failed local issue run and tolerate an already running local issue.'
  exit 1
}

if ($prompt -notmatch 'failed' -or $prompt -notmatch 'retry' -or $prompt -notmatch 'Inspect local job' -or $prompt -notmatch 'running') {
  Write-Error 'main-agent-startup-prompt.md must explain both failed issue recovery and already-running local issue behavior.'
  exit 1
}

if ($start -notmatch "Execution -eq 'failed'" -or $start -notmatch 'RecoverFailedRun' -or $start -notmatch 'Retry failed local issue' -or $start -notmatch 'A local issue run is already active') {
  Write-Error 'start-main-agent.ps1 must recover failed ready issues and fall back to observation mode when a local issue is already running.'
  exit 1
}

$startCompact = $start -replace '\s+', ''
$failedSelectionIndex = $startCompact.IndexOf('Where-Object{$_.State-eq''ready''-and$_.Execution-eq''failed''-and$_.Next-eq''Inspectlocaljob''}|')
$idleSelectionIndex = $startCompact.IndexOf('Where-Object{$_.State-eq''ready''-and$_.Execution-eq''idle''-and$_.Next-eq''Dispatchsubagent''}|')
if ($failedSelectionIndex -lt 0 -or $idleSelectionIndex -lt 0 -or $failedSelectionIndex -gt $idleSelectionIndex) {
  Write-Error 'start-main-agent.ps1 must prefer retrying a failed ready issue before dispatching a fresh idle ready issue.'
  exit 1
}

if ($dispatch -notmatch '\[switch\]\$RecoverFailedRun' -or $dispatch -notmatch 'worktree remove --force' -or $dispatch -notmatch 'failed local run') {
  Write-Error 'dispatch-issue.ps1 must expose an explicit recovery path that recreates a stale failed worktree before re-dispatch.'
  exit 1
}
