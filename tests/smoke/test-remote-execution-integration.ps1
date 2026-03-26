$required = @(
  'ops\remote-execution.yaml',
  'scripts\dispatch-issue.ps1',
  'scripts\sync-remote-execution.ps1',
  'scripts\prepare-remote-pr.ps1',
  'scripts\ensure-local-runtime.ps1',
  'scripts\start-local-agentboard.ps1',
  'workspace\runbooks\remote-jobs.json',
  'workspace\runbooks\remote-execution.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing remote execution files: " + ($missing -join ', '))
  exit 1
}

$config = Get-Content 'ops\remote-execution.yaml' -Raw
$dispatch = Get-Content 'scripts\dispatch-issue.ps1' -Raw
$sync = Get-Content 'scripts\sync-remote-execution.ps1' -Raw
$prepare = Get-Content 'scripts\prepare-remote-pr.ps1' -Raw
$runbook = Get-Content 'workspace\runbooks\remote-execution.md' -Raw
$registry = Get-Content 'workspace\runbooks\remote-jobs.json' -Raw

if ($config -notmatch 'transport:\s*local_process' -or $config -notmatch 'host:\s*localhost' -or $config -notmatch 'repo_path:\s*/root/NautilusTrader' -or $config -notmatch 'codex_orchestrator_bin:\s*codex-orchestrator' -or $config -notmatch 'runner:\s*rlm' -or $config -notmatch 'max_parallel_jobs:\s*1' -or $config -notmatch 'mode:\s*local_agentboard' -or $config -notmatch 'access:\s*local_http' -or $config -notmatch 'control:\s*full' -or $config -notmatch 'agentboard_bin:\s*agentboard') {
  Write-Error 'remote-execution.yaml must default to pure local codex-orchestrator execution with localhost paths and local agentboard access.'
  exit 1
}

if ($dispatch -notmatch 'IssueNumber' -or $dispatch -notmatch 'DryRun' -or $dispatch -notmatch 'codex-orchestrator start' -or $dispatch -notmatch '--goal' -or $dispatch -notmatch 'workspace/issue-packets' -or $dispatch -notmatch 'local_process' -or $dispatch -notmatch 'tmux') {
  Write-Error 'dispatch-issue.ps1 must support pure local codex-orchestrator dispatch in tmux with a dry-run mode.'
  exit 1
}

if ($sync -notmatch 'status --run' -or $sync -notmatch 'remote-jobs.json' -or $sync -notmatch 'awaiting-local-review' -or $sync -notmatch 'local_process' -or $sync -notmatch 'manifest.json') {
  Write-Error 'sync-remote-execution.ps1 must consume local codex-orchestrator status output and update remote-jobs plus ledger execution state.'
  exit 1
}

if ($prepare -notmatch 'runner.ndjson' -or $prepare -notmatch 'review-resolution-issue-' -or $prepare -notmatch 'Job Id' -or $prepare -notmatch 'local_process' -or $prepare -notmatch 'manifest.json') {
  Write-Error 'prepare-remote-pr.ps1 must collect local codex-orchestrator artifacts and populate issue-scoped review evidence.'
  exit 1
}

if ($runbook -notmatch 'agentboard' -or $runbook -notmatch 'http://127.0.0.1:8088' -or $runbook -notmatch 'codex-orchestrator' -or $runbook -notmatch 'same machine') {
  Write-Error 'remote-execution.md must document pure local codex-orchestrator execution and local agentboard access.'
  exit 1
}

if ($registry -notmatch '"version"\s*:\s*1' -or $registry -notmatch '"jobs"\s*:\s*\[') {
  Write-Error 'remote-jobs.json must initialize a versioned jobs array.'
  exit 1
}
