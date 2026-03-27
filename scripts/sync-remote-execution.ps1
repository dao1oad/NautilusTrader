[CmdletBinding()]
param(
  [string]$WorkerConfigPath = 'ops/remote-execution.yaml',
  [string]$RemoteJobsPath = 'workspace\runbooks\remote-jobs.json',
  [string]$LedgerPath = 'memory\issue-ledger.md',
  [string]$StatusJsonOverridePath = '',
  [string]$JobsJsonOverridePath = ''
)

$ErrorActionPreference = 'Stop'

# Execution contract:
# - codex-orchestrator status --run is the source of runtime status
# - workspace/runbooks/remote-jobs.json is the local execution registry

function Get-ConfigValue {
  param(
    [string]$Path,
    [string]$Key
  )

  $content = Get-Content $Path -Raw
  $pattern = ("(?m)^\s*{0}:\s*([^\r\n#]+)" -f [regex]::Escape($Key))
  if ($content -match $pattern) {
    return $Matches[1].Trim()
  }

  return ''
}

function Get-SectionValue {
  param(
    [string]$Path,
    [string]$Section,
    [string]$Key
  )

  $inSection = $false
  foreach ($line in Get-Content $Path) {
    if ($inSection) {
      if ($line -match '^[A-Za-z0-9_-]+:\s*$') {
        break
      }

      if ($line -match ("^\s{{2}}{0}:\s*(.*)$" -f [regex]::Escape($Key))) {
        return $Matches[1].Trim()
      }
    }

    if ($line -match ("^{0}:\s*$" -f [regex]::Escape($Section))) {
      $inSection = $true
    }
  }

  return ''
}

function Get-RemoteExecutionConfig {
  param([string]$Path)

  [pscustomobject]@{
    enabled = (Get-ConfigValue -Path $Path -Key 'enabled').ToLowerInvariant() -eq 'true'
    transport = Get-SectionValue -Path $Path -Section 'worker' -Key 'transport'
    worker_host = Get-SectionValue -Path $Path -Section 'worker' -Key 'host'
    worker_user = Get-SectionValue -Path $Path -Section 'worker' -Key 'ssh_user'
    repo_path = Get-SectionValue -Path $Path -Section 'worker' -Key 'repo_path'
    codex_orchestrator_bin = Get-SectionValue -Path $Path -Section 'worker' -Key 'codex_orchestrator_bin'
  }
}

function Get-RemoteJobsRegistry {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Remote jobs registry not found: $Path"
  }

  $raw = Get-Content $Path -Raw
  if (-not $raw.Trim()) {
    return [pscustomobject]@{
      version = 1
      jobs = @()
    }
  }

  return $raw | ConvertFrom-Json
}

function Save-RemoteJobsRegistry {
  param(
    [string]$Path,
    [object]$Registry
  )

  $Registry | ConvertTo-Json -Depth 8 | Set-Content -Path $Path
}

function Resolve-ConfigPath {
  param([string]$Path)

  if (-not $Path) {
    return ''
  }

  if ($Path.StartsWith('~/') -or $Path.StartsWith('~\')) {
    $relative = $Path.Substring(2).Replace('/', [System.IO.Path]::DirectorySeparatorChar).Replace('\', [System.IO.Path]::DirectorySeparatorChar)
    return Join-Path $HOME $relative
  }

  return $Path
}

function Resolve-CommandPath {
  param([string]$ConfiguredPath)

  $resolvedPath = Resolve-ConfigPath -Path $ConfiguredPath
  if ($resolvedPath -and (Test-Path $resolvedPath)) {
    return (Resolve-Path $resolvedPath).ProviderPath
  }

  if ($resolvedPath) {
    try {
      return (Get-Command $resolvedPath -ErrorAction Stop).Source
    } catch {
    }
  }

  throw "Command executable not found. Checked configured path: $ConfiguredPath"
}

function Get-JsonObjectFromText {
  param([string]$Text)

  $trimmed = $Text.Trim()
  if (-not $trimmed) {
    return $null
  }

  try {
    return $trimmed | ConvertFrom-Json
  } catch {
  }

  $jsonStart = $trimmed.LastIndexOf('{')
  while ($jsonStart -ge 0) {
    try {
      return $trimmed.Substring($jsonStart) | ConvertFrom-Json
    } catch {
      $jsonStart = $trimmed.LastIndexOf('{', $jsonStart - 1)
    }
  }

  return $null
}

function Resolve-ArtifactPath {
  param(
    [string]$WorktreePath,
    [string]$ArtifactPath
  )

  if (-not $ArtifactPath) {
    return ''
  }

  if ([System.IO.Path]::IsPathRooted($ArtifactPath)) {
    return $ArtifactPath
  }

  $basePath = if ($WorktreePath) { $WorktreePath } else { (Get-Location).Path }
  return Join-Path $basePath ($ArtifactPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
}

function Get-ManifestSummary {
  param([string]$ManifestPath)

  if (-not $ManifestPath -or -not (Test-Path $ManifestPath)) {
    return ''
  }

  $manifest = Get-JsonObjectFromText -Text (Get-Content $ManifestPath -Raw)
  if ($manifest -and $manifest.summary) {
    return [string]$manifest.summary
  }

  return ''
}

function Update-IssueLedgerRow {
  param(
    [string]$Path,
    [string]$TargetIssueNumber,
    [hashtable]$Updates
  )

  $updated = $false
  $newLines = foreach ($line in Get-Content $Path) {
    if ($line -like "| #$TargetIssueNumber |*") {
      $cells = @($line.Trim('|').Split('|') | ForEach-Object { $_.Trim() })
      if ($cells.Count -lt 12) {
        throw "Issue ledger row for #$TargetIssueNumber must contain the execution-aware columns."
      }

      $indexMap = @{
        Execution = 6
        Worker = 7
        Job = 8
        Branch = 9
        PR = 10
        Next = 11
      }

      foreach ($key in $Updates.Keys) {
        if ($indexMap.ContainsKey($key)) {
          $cells[$indexMap[$key]] = [string]$Updates[$key]
        }
      }

      $updated = $true
      '| ' + ($cells -join ' | ') + ' |'
      continue
    }

    $line
  }

  if (-not $updated) {
    throw "Issue #$TargetIssueNumber is not present in $Path."
  }

  Set-Content -Path $Path -Value $newLines
}

function Test-IssueLedgerRowExists {
  param(
    [string]$Path,
    [string]$TargetIssueNumber
  )

  foreach ($line in Get-Content $Path) {
    if ($line -like "| #$TargetIssueNumber |*") {
      return $true
    }
  }

  return $false
}

function Set-ObjectProperty {
  param(
    [object]$Object,
    [string]$Name,
    [object]$Value
  )

  if ($Object.PSObject.Properties.Name -contains $Name) {
    $Object.$Name = $Value
  } else {
    $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value -Force
  }
}

function Get-LedgerNextStep {
  param([string]$Execution)

  switch ($Execution) {
    'running' { return 'Wait for local execution' }
    'awaiting-local-review' { return 'Complete local pre-PR review' } # Execution=awaiting-local-review
    'failed' { return 'Inspect local job' }
    'merged' { return 'Archived' }
    default { return 'Dispatch subagent' }
  }
}

$config = Get-RemoteExecutionConfig -Path $WorkerConfigPath
if (-not $config.enabled) {
  throw 'Execution is disabled in ops/remote-execution.yaml.'
}

if ([string]$config.transport -ne 'local_process') {
  throw "Only pure local execution is supported. Set worker.transport to local_process in $WorkerConfigPath."
}

$registry = Get-RemoteJobsRegistry -Path $RemoteJobsPath
$overridePayload = $null
if ($StatusJsonOverridePath) {
  if (-not (Test-Path $StatusJsonOverridePath)) {
    throw "StatusJsonOverridePath not found: $StatusJsonOverridePath"
  }

  $overridePayload = Get-JsonObjectFromText -Text (Get-Content $StatusJsonOverridePath -Raw)
} elseif ($JobsJsonOverridePath) {
  if (-not (Test-Path $JobsJsonOverridePath)) {
    throw "JobsJsonOverridePath not found: $JobsJsonOverridePath"
  }

  $overridePayload = Get-JsonObjectFromText -Text (Get-Content $JobsJsonOverridePath -Raw)
}

$orchestratorPath = $null
if (-not $overridePayload) {
  $orchestratorPath = Resolve-CommandPath -ConfiguredPath $config.codex_orchestrator_bin
}

foreach ($jobRecord in @($registry.jobs)) {
  $remoteJob = $overridePayload

  if (-not $remoteJob) {
    $statusBasePath = if ($jobRecord.worktree_path) { [string]$jobRecord.worktree_path } elseif ($jobRecord.repo_path) { [string]$jobRecord.repo_path } else { [string](Resolve-ConfigPath -Path $config.repo_path) }
    Push-Location $statusBasePath
    try {
      $statusText = (& $orchestratorPath status --run ([string]$jobRecord.job_id) --format json 2>&1 | Out-String)
    } finally {
      Pop-Location
    }

    if ($LASTEXITCODE -eq 0) {
      $remoteJob = Get-JsonObjectFromText -Text $statusText
    }
  }

  if ($remoteJob) {
    # manifest.json is the durable status source for codex-orchestrator runs.
    $basePath = if ($jobRecord.worktree_path) { [string]$jobRecord.worktree_path } elseif ($jobRecord.repo_path) { [string]$jobRecord.repo_path } else { [string](Resolve-ConfigPath -Path $config.repo_path) }
    $manifestPath = Resolve-ArtifactPath -WorktreePath $basePath -ArtifactPath ([string]$remoteJob.manifest)
    $artifactRoot = Resolve-ArtifactPath -WorktreePath $basePath -ArtifactPath ([string]$remoteJob.artifact_root)
    $logPath = Resolve-ArtifactPath -WorktreePath $basePath -ArtifactPath ([string]$remoteJob.log_path)
    $summary = Get-ManifestSummary -ManifestPath $manifestPath
    if (-not $summary) {
      $summary = if ($jobRecord.summary) { $jobRecord.summary } else { "Local status: $($remoteJob.status)" }
    }

    $isStale = $false
    if ($remoteJob.PSObject.Properties.Name -contains 'activity' -and $remoteJob.activity) {
      $activity = $remoteJob.activity
      if ($activity.PSObject.Properties.Name -contains 'stale') {
        $isStale = [bool]$activity.stale
      }
    }

    $mappedExecution = switch ([string]$remoteJob.status) {
      'succeeded' { 'awaiting-local-review' }
      'completed' { 'awaiting-local-review' } # Execution=awaiting-local-review
      'running' { 'running' }
      'in_progress' { 'running' }
      'queued' { 'running' }
      'pending' { 'running' }
      'failed' { 'failed' }
      default { [string]$jobRecord.execution_status }
    }

    if (-not $mappedExecution) {
      $mappedExecution = 'failed'
    }

    if ($isStale -and $mappedExecution -eq 'running') {
      $mappedExecution = 'failed'
      $summary = if ($summary -match '(?i)stale') {
        $summary
      } else {
        "$summary`nLocal codex-orchestrator run became stale and requires inspection."
      }
    }

    $remoteStatus = if ($isStale) { 'stale' } else { [string]$remoteJob.status }
    Set-ObjectProperty -Object $jobRecord -Name 'remote_status' -Value $remoteStatus
    Set-ObjectProperty -Object $jobRecord -Name 'summary' -Value $summary
    if ($manifestPath) { Set-ObjectProperty -Object $jobRecord -Name 'manifest_path' -Value ($manifestPath.Replace('\', '/')) }
    if ($artifactRoot) { Set-ObjectProperty -Object $jobRecord -Name 'artifact_root' -Value ($artifactRoot.Replace('\', '/')) }
    if ($logPath) { Set-ObjectProperty -Object $jobRecord -Name 'log_path' -Value ($logPath.Replace('\', '/')) }
    Set-ObjectProperty -Object $jobRecord -Name 'execution_status' -Value $mappedExecution
  } elseif ([string]$jobRecord.execution_status -in @('running', 'dispatching')) {
    $summary = if ($jobRecord.summary) { $jobRecord.summary } else { 'Local codex-orchestrator status is unavailable for this run.' }
    Set-ObjectProperty -Object $jobRecord -Name 'remote_status' -Value 'missing'
    Set-ObjectProperty -Object $jobRecord -Name 'execution_status' -Value 'failed'
    Set-ObjectProperty -Object $jobRecord -Name 'summary' -Value $summary
  }

  Set-ObjectProperty -Object $jobRecord -Name 'last_synced_at' -Value ((Get-Date).ToString('o'))
  $prValue = if ($jobRecord.pr_number) { "#$($jobRecord.pr_number)" } else { 'TBD' }

  if (-not (Test-IssueLedgerRowExists -Path $LedgerPath -TargetIssueNumber $jobRecord.issue_number)) {
    # build-workset rebuilds the ledger from open issues only, so any missing row
    # must be archived in the local execution registry instead of blocking startup.
    if ([string]$jobRecord.execution_status -ne 'merged') {
      Set-ObjectProperty -Object $jobRecord -Name 'execution_status' -Value 'merged'
      if (-not $jobRecord.summary) {
        Set-ObjectProperty -Object $jobRecord -Name 'summary' -Value 'Archived because the issue is no longer present in the rebuilt open-issue ledger.'
      }
    }

    continue
  }

  Update-IssueLedgerRow -Path $LedgerPath -TargetIssueNumber $jobRecord.issue_number -Updates @{
    Execution = $jobRecord.execution_status
    Worker = $jobRecord.worker_host
    Job = $jobRecord.job_id
    Branch = $jobRecord.branch
    PR = $prValue
    Next = Get-LedgerNextStep -Execution $jobRecord.execution_status
  }
}

Save-RemoteJobsRegistry -Path $RemoteJobsPath -Registry $registry
Write-Host 'Local execution registry and issue ledger are synchronized.'
