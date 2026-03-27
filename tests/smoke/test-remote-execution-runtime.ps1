$powerShellExe = (Get-Process -Id $PID).Path
$packetDir = 'workspace/issue-packets'
$bootstrapPacket = Join-Path $packetDir 'issue-999.md'
$bootstrapLedger = Join-Path ([System.IO.Path]::GetTempPath()) ('issue-ledger-bootstrap-' + [guid]::NewGuid().ToString() + '.md')

$packet = Get-ChildItem -Path 'workspace/issue-packets' -File -Filter 'issue-*.md' | Sort-Object Name | Select-Object -First 1
if (-not $packet) {
  New-Item -ItemType Directory -Force -Path $packetDir | Out-Null
  Set-Content -Path $bootstrapPacket -Value @'
# Issue Packet: #999

## Issue

- ID: 999
- Title: Local runtime smoke seed
- Priority: High
- Dependencies: None

## Goal

Exercise pure local runtime plumbing.

## Constraints

- Follow AGENTS.md
'@
  $packet = Get-Item $bootstrapPacket
}

$match = [regex]::Match($packet.BaseName, 'issue-(\d+)$')
if (-not $match.Success) {
  Write-Error "Unable to resolve issue number from packet path $($packet.FullName)."
  exit 1
}

$issueNumber = [int]$match.Groups[1].Value
Set-Content -Path $bootstrapLedger -Value @"
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #$issueNumber | Local runtime smoke seed | High | None | ready | No | idle | TBD | TBD | TBD | TBD | Dispatch subagent |
"@

$dispatchOutput = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File 'scripts/dispatch-issue.ps1' -IssueNumber $issueNumber -LedgerPath $bootstrapLedger -DryRun 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
  Write-Error ("dispatch-issue.ps1 dry run failed for issue #{0}: {1}" -f $issueNumber, $dispatchOutput.Trim())
  exit 1
}

if ($dispatchOutput -notmatch ('"issue"\s*:\s*{0}' -f $issueNumber) -or $dispatchOutput -notmatch '"dispatch_prompt"' -or $dispatchOutput -notmatch '"task_id"' -or $dispatchOutput -notmatch '"tmux_session"' -or $dispatchOutput -notmatch '"worker"\s*:\s*"localhost"' -or $dispatchOutput -notmatch '"orchestrator"\s*:\s*"codex-orchestrator"') {
  Write-Error 'dispatch-issue.ps1 dry run must emit JSON describing the pure local dispatch payload.'
  exit 1
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('remote-exec-runtime-' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

try {
  $syncLedgerPath = Join-Path $tempRoot 'sync-issue-ledger.md'
  $syncRegistryPath = Join-Path $tempRoot 'sync-remote-jobs.json'
  $statusJsonPath = Join-Path $tempRoot 'codex-status.json'

  Set-Content -Path $syncLedgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #202 | Local sync verification | High | None | ready | No | running | localhost | job-202 | codex/issue-202-local-sync-verification | TBD | Wait for local execution |
'@

  Set-Content -Path $syncRegistryPath -Value @'
{
  "version": 1,
  "jobs": [
    {
      "issue_number": 202,
      "worker_host": "localhost",
      "branch": "codex/issue-202-local-sync-verification",
      "job_id": "job-202",
      "task_id": "issue-202-local-sync-verification",
      "manifest_path": "/tmp/manifest-202.json",
      "execution_status": "running",
      "summary": "Local execution in progress"
    }
  ]
}
'@

  Set-Content -Path $statusJsonPath -Value @'
{
  "run_id": "job-202",
  "status": "completed",
  "manifest": ".runs/issue-202/cli/job-202/manifest.json",
  "artifact_root": ".runs/issue-202/cli/job-202",
  "log_path": ".runs/issue-202/cli/job-202/runner.ndjson",
  "commands": [
    {
      "id": "rlm-runner",
      "status": "completed",
      "log_path": ".runs/issue-202/cli/job-202/commands/01-rlm-runner.ndjson"
    }
  ]
}
'@

  $syncOutput = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File 'scripts/sync-remote-execution.ps1' `
    -WorkerConfigPath 'ops/remote-execution.yaml' `
    -RemoteJobsPath $syncRegistryPath `
    -LedgerPath $syncLedgerPath `
    -StatusJsonOverridePath $statusJsonPath 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Error ("sync-remote-execution.ps1 failed: {0}" -f $syncOutput.Trim())
    exit 1
  }

  $syncLedger = Get-Content $syncLedgerPath -Raw
  $syncRegistry = Get-Content $syncRegistryPath -Raw
  if ($syncLedger -notmatch 'awaiting-local-review' -or $syncLedger -notmatch 'Complete local pre-PR review') {
    Write-Error 'sync-remote-execution.ps1 must advance the ledger to awaiting-local-review when the remote job completes.'
    exit 1
  }

  if ($syncRegistry -notmatch '"execution_status"\s*:\s*"awaiting-local-review"' -or $syncRegistry -notmatch '"remote_status"\s*:\s*"completed"') {
    Write-Error 'sync-remote-execution.ps1 must persist both execution_status and remote_status in remote-jobs.json.'
    exit 1
  }

  $staleRunningLedgerPath = Join-Path $tempRoot 'stale-running-issue-ledger.md'
  $staleRunningRegistryPath = Join-Path $tempRoot 'stale-running-remote-jobs.json'
  $staleRunningStatusPath = Join-Path $tempRoot 'stale-running-status.json'

  Set-Content -Path $staleRunningLedgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #204 | Stale local run verification | High | None | ready | No | running | localhost | job-204 | codex/issue-204-stale-local-run-verification | TBD | Wait for local execution |
'@

  Set-Content -Path $staleRunningRegistryPath -Value @'
{
  "version": 1,
  "jobs": [
    {
      "issue_number": 204,
      "worker_host": "localhost",
      "branch": "codex/issue-204-stale-local-run-verification",
      "job_id": "job-204",
      "task_id": "issue-204-stale-local-run-verification",
      "execution_status": "running",
      "summary": "Local execution in progress"
    }
  ]
}
'@

  Set-Content -Path $staleRunningStatusPath -Value @'
{
  "run_id": "job-204",
  "status": "in_progress",
  "manifest": ".runs/issue-204/cli/job-204/manifest.json",
  "artifact_root": ".runs/issue-204/cli/job-204",
  "log_path": ".runs/issue-204/cli/job-204/runner.ndjson",
  "activity": {
    "stale": true,
    "age_seconds": 120,
    "stale_threshold_seconds": 30
  }
}
'@

  $staleRunningSyncOutput = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File 'scripts/sync-remote-execution.ps1' `
    -WorkerConfigPath 'ops/remote-execution.yaml' `
    -RemoteJobsPath $staleRunningRegistryPath `
    -LedgerPath $staleRunningLedgerPath `
    -StatusJsonOverridePath $staleRunningStatusPath 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Error ("sync-remote-execution.ps1 must mark stale local runs as failed recoverable jobs: {0}" -f $staleRunningSyncOutput.Trim())
    exit 1
  }

  $staleRunningLedger = Get-Content $staleRunningLedgerPath -Raw
  $staleRunningRegistry = Get-Content $staleRunningRegistryPath -Raw
  if ($staleRunningLedger -notmatch '\| #204 \| Stale local run verification \| .* \| ready \| .* \| failed \| localhost \| job-204 \| codex/issue-204-stale-local-run-verification \| TBD \| Inspect local job \|') {
    Write-Error 'sync-remote-execution.ps1 must downgrade stale local runs to failed execution in the ledger.'
    exit 1
  }

  if ($staleRunningRegistry -notmatch '"execution_status"\s*:\s*"failed"' -or $staleRunningRegistry -notmatch 'stale') {
    Write-Error 'sync-remote-execution.ps1 must persist stale local runs as failed with a stale-run summary.'
    exit 1
  }

  $archivedLedgerPath = Join-Path $tempRoot 'archived-issue-ledger.md'
  $archivedRegistryPath = Join-Path $tempRoot 'archived-remote-jobs.json'
  $emptyRemoteStatusPath = Join-Path $tempRoot 'empty-remote-status.json'

  Set-Content -Path $archivedLedgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #42 | Governance check-run alignment | Medium | None | ready | No | idle | TBD | TBD | TBD | TBD | Dispatch subagent |
'@

  Set-Content -Path $archivedRegistryPath -Value @'
{
  "version": 1,
  "jobs": [
    {
      "issue_number": 47,
      "worker_host": "localhost",
      "branch": "codex/issue-47-governance-finalize-pure-local-codex-runtime-and-sync-protected-main",
      "job_id": "job-47",
      "task_id": "issue-47-governance-finalize-pure-local-codex-runtime-and-sync-protected-main",
      "execution_status": "merged",
      "summary": "Merged governance recovery"
    }
  ]
}
'@

  Set-Content -Path $emptyRemoteStatusPath -Value @'
{}
'@

  $archivedSyncOutput = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File 'scripts/sync-remote-execution.ps1' `
    -WorkerConfigPath 'ops/remote-execution.yaml' `
    -RemoteJobsPath $archivedRegistryPath `
    -LedgerPath $archivedLedgerPath `
    -JobsJsonOverridePath $emptyRemoteStatusPath 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Error ("sync-remote-execution.ps1 must tolerate merged jobs whose issue row is no longer present in the rebuilt ledger: {0}" -f $archivedSyncOutput.Trim())
    exit 1
  }

  $archivedLedger = Get-Content $archivedLedgerPath -Raw
  $archivedRegistry = Get-Content $archivedRegistryPath -Raw
  if ($archivedLedger -match '#47') {
    Write-Error 'sync-remote-execution.ps1 must not reintroduce archived merged issues into the rebuilt open-issue ledger.'
    exit 1
  }

  if ($archivedRegistry -notmatch '"execution_status"\s*:\s*"merged"') {
    Write-Error 'sync-remote-execution.ps1 must preserve merged execution state for archived jobs.'
    exit 1
  }

  $staleClosedLedgerPath = Join-Path $tempRoot 'stale-closed-issue-ledger.md'
  $staleClosedRegistryPath = Join-Path $tempRoot 'stale-closed-remote-jobs.json'
  $staleClosedStatusPath = Join-Path $tempRoot 'stale-closed-status.json'

  Set-Content -Path $staleClosedLedgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #42 | Governance check-run alignment | Medium | None | ready | No | idle | TBD | TBD | TBD | TBD | Dispatch subagent |
'@

  Set-Content -Path $staleClosedRegistryPath -Value @'
{
  "version": 1,
  "jobs": [
    {
      "issue_number": 47,
      "worker_host": "localhost",
      "branch": "codex/issue-47-governance-finalize-pure-local-codex-runtime-and-sync-protected-main",
      "job_id": "job-47",
      "task_id": "issue-47-governance-finalize-pure-local-codex-runtime-and-sync-protected-main",
      "execution_status": "running",
      "summary": "Stale local execution"
    }
  ]
}
'@

  Set-Content -Path $staleClosedStatusPath -Value @'
{
  "run_id": "job-47",
  "status": "in_progress",
  "manifest": ".runs/issue-47/cli/job-47/manifest.json",
  "artifact_root": ".runs/issue-47/cli/job-47",
  "log_path": ".runs/issue-47/cli/job-47/runner.ndjson"
}
'@

  $staleClosedSyncOutput = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File 'scripts/sync-remote-execution.ps1' `
    -WorkerConfigPath 'ops/remote-execution.yaml' `
    -RemoteJobsPath $staleClosedRegistryPath `
    -LedgerPath $staleClosedLedgerPath `
    -StatusJsonOverridePath $staleClosedStatusPath 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Error ("sync-remote-execution.ps1 must archive stale jobs whose issue is no longer present in the rebuilt open-issue ledger: {0}" -f $staleClosedSyncOutput.Trim())
    exit 1
  }

  $staleClosedLedger = Get-Content $staleClosedLedgerPath -Raw
  $staleClosedRegistry = Get-Content $staleClosedRegistryPath -Raw
  if ($staleClosedLedger -match '#47') {
    Write-Error 'sync-remote-execution.ps1 must not reintroduce stale closed issues into the rebuilt open-issue ledger.'
    exit 1
  }

  if ($staleClosedRegistry -notmatch '"execution_status"\s*:\s*"merged"') {
    Write-Error 'sync-remote-execution.ps1 must archive stale jobs whose issue disappeared from the rebuilt open-issue ledger.'
    exit 1
  }

  $prepareLedgerPath = Join-Path $tempRoot 'prepare-issue-ledger.md'
  $prepareRegistryPath = Join-Path $tempRoot 'prepare-remote-jobs.json'
  $prepareOutputPath = Join-Path $tempRoot 'job-output.json'
  $reviewResolutionPath = Join-Path $tempRoot 'review-resolution-issue-303.md'
  $artifactPath = Join-Path $tempRoot 'remote-output-issue-303.md'

  Set-Content -Path $prepareLedgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #303 | Local prepare verification | High | None | ready | No | running | localhost | job-303 | codex/issue-303-local-prepare-verification | TBD | Wait for local execution |
'@

  Set-Content -Path $prepareRegistryPath -Value @'
{
  "version": 1,
  "jobs": [
    {
      "issue_number": 303,
      "worker_host": "localhost",
      "branch": "codex/issue-303-local-prepare-verification",
      "job_id": "job-303",
      "task_id": "issue-303-local-prepare-verification",
      "manifest_path": "/tmp/manifest-303.json",
      "artifact_root": "/tmp/run-303",
      "log_path": "/tmp/run-303/runner.ndjson",
      "execution_status": "running",
      "summary": "Stage 'Run RLM loop' failed with exit code 10.",
      "files_modified": [
        "scripts/dispatch-issue.ps1"
      ]
    }
  ]
}
'@

  Set-Content -Path $prepareOutputPath -Value @'
{
  "summary": "Implemented local PR payload",
  "status": "completed",
  "manifest_path": ".runs/issue-303/cli/job-303/manifest.json",
  "log_path": ".runs/issue-303/cli/job-303/runner.ndjson",
  "files_modified": [
    "scripts/prepare-remote-pr.ps1",
    "ops/remote-execution.yaml"
  ],
  "tests": [
    "pwsh -NoProfile -File tests/smoke/run-all.ps1"
  ],
  "notes": [
    "Ready for governance review"
  ]
}
'@

  $prepareRunOutput = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File 'scripts/prepare-remote-pr.ps1' `
    -IssueNumber 303 `
    -WorkerConfigPath 'ops/remote-execution.yaml' `
    -RemoteJobsPath $prepareRegistryPath `
    -LedgerPath $prepareLedgerPath `
    -ReviewResolutionPath $reviewResolutionPath `
    -JobOutputOverridePath $prepareOutputPath `
    -OutputArtifactPath $artifactPath 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Write-Error ("prepare-remote-pr.ps1 failed: {0}" -f $prepareRunOutput.Trim())
    exit 1
  }

  $prepareLedger = Get-Content $prepareLedgerPath -Raw
  $prepareRegistry = Get-Content $prepareRegistryPath -Raw
  $reviewResolution = Get-Content $reviewResolutionPath -Raw
  $artifact = Get-Content $artifactPath -Raw

  if ($prepareLedger -notmatch 'awaiting-local-review' -or $prepareLedger -notmatch 'Complete local pre-PR review') {
    Write-Error 'prepare-remote-pr.ps1 must advance the issue ledger to awaiting-local-review.'
    exit 1
  }

  if ($prepareRegistry -notmatch '"review_resolution_path"' -or $prepareRegistry -notmatch '"output_artifact_path"' -or $prepareRegistry -notmatch '"execution_status"\s*:\s*"awaiting-local-review"' -or $prepareRegistry -notmatch '"manifest_path"') {
    Write-Error 'prepare-remote-pr.ps1 must persist review resolution and output artifact paths in remote-jobs.json.'
    exit 1
  }

  if ($prepareRegistry -notmatch '"summary"\s*:\s*"Implemented local PR payload"') {
    Write-Error 'prepare-remote-pr.ps1 must let override payload summaries replace stale failed-job summaries when preparing local review.'
    exit 1
  }

  if ($prepareRegistry -notmatch '"manifest_path"\s*:\s*"\.runs/issue-303/cli/job-303/manifest\.json"' -or $prepareRegistry -notmatch '"log_path"\s*:\s*"\.runs/issue-303/cli/job-303/runner\.ndjson"') {
    Write-Error 'prepare-remote-pr.ps1 must persist override manifest/log paths without stringifying the entire override object.'
    exit 1
  }

  if ($reviewResolution -notmatch 'Worker: localhost' -or $reviewResolution -notmatch 'Job Id: job-303' -or $reviewResolution -notmatch 'Agent Output Summary: Implemented local PR payload') {
    Write-Error 'prepare-remote-pr.ps1 must write issue-scoped review evidence with the local job identity and output summary.'
    exit 1
  }

  if ($artifact -notmatch 'Implemented local PR payload') {
    Write-Error 'prepare-remote-pr.ps1 must persist the captured local output artifact.'
    exit 1
  }
} finally {
  Remove-Item -Path $bootstrapPacket -Force -ErrorAction SilentlyContinue
  Remove-Item -Path $bootstrapLedger -Force -ErrorAction SilentlyContinue
  if (Test-Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force
  }
}
