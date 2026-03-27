$required = @(
  'prompts\main-agent-startup-prompt.md',
  'scripts\start-main-agent.ps1',
  'scripts\ensure-local-runtime.ps1',
  'scripts\start-local-agentboard.ps1'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing main-agent startup prompt files: " + ($missing -join ', '))
  exit 1
}

$prompt = Get-Content 'prompts\main-agent-startup-prompt.md' -Raw
$script = Get-Content 'scripts\start-main-agent.ps1' -Raw
$agents = Get-Content 'AGENTS.md' -Raw
$requiredPhrases = @(
  'AGENTS.md',
  'scripts/check-governance.ps1',
  'scripts/sync-issues.ps1',
  'scripts/build-workset.ps1',
  'scripts/dispatch-issue.ps1',
  'scripts/sync-remote-execution.ps1',
  'ops/remote-execution.yaml',
  'agentboard',
  'http://127.0.0.1:8088',
  'workspace/runbooks/remote-jobs.json',
  'memory/issue-ledger.md'
)

foreach ($phrase in $requiredPhrases) {
  if ($prompt -notmatch [regex]::Escape($phrase)) {
    Write-Error ("Main-agent startup prompt is missing phrase: " + $phrase)
    exit 1
  }
}

$requiredScriptPhrases = @(
  'scripts/check-governance.ps1',
  'scripts/ensure-local-runtime.ps1',
  'scripts/start-local-agentboard.ps1',
  'scripts/sync-issues.ps1',
  'scripts/build-workset.ps1',
  'scripts/sync-remote-execution.ps1',
  'Issue Ledger',
  'Dispatch subagent',
  'http://127.0.0.1:8088'
)

foreach ($phrase in $requiredScriptPhrases) {
  if ($script -notmatch [regex]::Escape($phrase)) {
    Write-Error ("start-main-agent.ps1 is missing phrase: " + $phrase)
    exit 1
  }
}

if ($prompt -match 'ssh -L 8088:127.0.0.1:8088' -or $script -match 'ssh -L 8088:127.0.0.1:8088') {
  Write-Error 'Main-agent startup prompt and script must no longer require an SSH tunnel for agentboard in pure local mode.'
  exit 1
}

if ($agents -notmatch 'Default Startup Behavior' -or $agents -notmatch 'continue' -or $agents -notmatch 'scripts/check-governance.ps1') {
  Write-Error 'AGENTS.md must define the default startup behavior for the main agent when the user asks to continue.'
  exit 1
}

$readme = Get-Content 'README.md' -Raw
if ($readme -notmatch 'main-agent-startup-prompt.md' -or $readme -notmatch 'scripts/start-main-agent.ps1' -or $readme -notmatch 'codex' -or $readme -notmatch 'continue') {
  Write-Error 'README.md must explain the simplified current-project startup path using Codex, scripts/start-main-agent.ps1, and the English `continue` entrypoint.'
  exit 1
}

if ($readme -match '继续') {
  Write-Error 'README.md must keep the simplified startup path English-only so it passes the repository non-Latin governance hook.'
  exit 1
}

if ($readme -match 'git checkout codex/local-pre-pr-review-governance' -or $readme -match 'ssh -L 8088:127.0.0.1:8088') {
  Write-Error 'README.md must describe the pure local startup path without branch switching or SSH tunneling.'
  exit 1
}

if ($readme -notmatch 'codex-orchestrator' -or $readme -notmatch 'agentboard') {
  Write-Error 'README.md must describe the local codex-orchestrator and agentboard startup path.'
  exit 1
}
