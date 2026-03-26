[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][int]$IssueNumber,
  [string]$WorkerConfigPath = 'ops/remote-execution.yaml',
  [string]$RemoteJobsPath = 'workspace\runbooks\remote-jobs.json',
  [string]$LedgerPath = 'memory\issue-ledger.md',
  [switch]$RecoverFailedRun,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Execution contract:
# - codex-orchestrator start launches the bounded issue packet
# - workspace/runbooks/remote-jobs.json records the active job registry

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

function Get-SectionList {
  param(
    [string]$Path,
    [string]$Section,
    [string]$Key
  )

  $items = @()
  $inSection = $false
  $inList = $false

  foreach ($line in Get-Content $Path) {
    if ($inSection) {
      if ($inList) {
        if ($line -match '^\s{4}-\s*(.+)$') {
          $items += $Matches[1].Trim()
          continue
        }

        if ($line -match '^\s{2}[A-Za-z0-9_-]+:' -or $line -match '^[A-Za-z0-9_-]+:') {
          break
        }
      } else {
        if ($line -match ("^\s{{2}}{0}:\s*$" -f [regex]::Escape($Key))) {
          $inList = $true
          continue
        }

        if ($line -match '^[A-Za-z0-9_-]+:\s*$') {
          break
        }
      }
    }

    if ($line -match ("^{0}:\s*$" -f [regex]::Escape($Section))) {
      $inSection = $true
    }
  }

  return $items
}

function Get-RemoteExecutionConfig {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Remote execution config not found: $Path"
  }

  [pscustomobject]@{
    enabled = (Get-ConfigValue -Path $Path -Key 'enabled').ToLowerInvariant() -eq 'true'
    transport = Get-SectionValue -Path $Path -Section 'worker' -Key 'transport'
    worker_host = Get-SectionValue -Path $Path -Section 'worker' -Key 'host'
    worker_user = Get-SectionValue -Path $Path -Section 'worker' -Key 'ssh_user'
    repo_path = Get-SectionValue -Path $Path -Section 'worker' -Key 'repo_path'
    worktree_root = Get-SectionValue -Path $Path -Section 'worker' -Key 'worktree_root'
    dispatch_root = Get-SectionValue -Path $Path -Section 'worker' -Key 'dispatch_root'
    branch_prefix = Get-SectionValue -Path $Path -Section 'worker' -Key 'branch_prefix'
    codex_orchestrator_bin = Get-SectionValue -Path $Path -Section 'worker' -Key 'codex_orchestrator_bin'
    runner = Get-SectionValue -Path $Path -Section 'worker' -Key 'runner'
    model = Get-SectionValue -Path $Path -Section 'dispatch' -Key 'model'
    reasoning = Get-SectionValue -Path $Path -Section 'dispatch' -Key 'reasoning'
    sandbox = Get-SectionValue -Path $Path -Section 'dispatch' -Key 'sandbox'
    include_files = @(Get-SectionList -Path $Path -Section 'dispatch' -Key 'include_files')
  }
}

function Get-RemoteJobsRegistry {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    $parent = Split-Path -Parent $Path
    if ($parent) {
      New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    $registry = [pscustomobject]@{
      version = 1
      jobs = @()
    }
    $registry | ConvertTo-Json -Depth 8 | Set-Content -Path $Path
    return $registry
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

function Get-IssueLedgerRow {
  param(
    [string]$Path,
    [string]$TargetIssueNumber
  )

  foreach ($line in Get-Content $Path) {
    if ($line -like "| #$TargetIssueNumber |*") {
      $cells = @($line.Trim('|').Split('|') | ForEach-Object { $_.Trim() })
      return [pscustomobject]@{
        raw = $line
        cells = $cells
        title = if ($cells.Count -gt 1) { $cells[1] } else { '' }
        state = if ($cells.Count -gt 4) { $cells[4] } else { '' }
        execution = if ($cells.Count -gt 6) { $cells[6] } else { '' }
        worker = if ($cells.Count -gt 7) { $cells[7] } else { '' }
        job = if ($cells.Count -gt 8) { $cells[8] } else { '' }
        branch = if ($cells.Count -gt 9) { $cells[9] } else { '' }
        next = if ($cells.Count -gt 11) { $cells[11] } else { '' }
      }
    }
  }

  return $null
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
        Issue = 0
        Title = 1
        Priority = 2
        Dependencies = 3
        State = 4
        Parallel = 5
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

function ConvertTo-Slug {
  param([string]$Text)

  $slug = $Text.ToLowerInvariant()
  $slug = [regex]::Replace($slug, '[^a-z0-9]+', '-')
  $slug = $slug.Trim('-')
  if (-not $slug) {
    return 'task'
  }

  return $slug
}

function ConvertTo-ShellLiteral {
  param([string]$Text)

  if ($null -eq $Text) {
    return "''"
  }

  $replacement = ([string][char]39) + ([string][char]34) + ([string][char]39) + ([string][char]34) + ([string][char]39)
  $escaped = $Text.Replace("'", $replacement)
  return "'" + $escaped + "'"
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

function Get-RunRootForTask {
  param(
    [string]$WorktreePath,
    [string]$TaskId
  )

  return Join-Path $WorktreePath (Join-Path '.runs' (Join-Path $TaskId 'cli'))
}

function Get-RunIdsForTask {
  param(
    [string]$WorktreePath,
    [string]$TaskId
  )

  $runRoot = Get-RunRootForTask -WorktreePath $WorktreePath -TaskId $TaskId
  if (-not (Test-Path $runRoot)) {
    return @()
  }

  return @(
    Get-ChildItem -Path $runRoot -Directory -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTimeUtc |
      ForEach-Object { $_.Name }
  )
}

function Wait-ForNewRunId {
  param(
    [string]$WorktreePath,
    [string]$TaskId,
    [string[]]$BeforeRunIds,
    [int]$TimeoutSeconds = 30
  )

  $knownIds = @{}
  foreach ($runId in $BeforeRunIds) {
    $knownIds[[string]$runId] = $true
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    foreach ($candidate in (Get-RunIdsForTask -WorktreePath $WorktreePath -TaskId $TaskId)) {
      if (-not $knownIds.ContainsKey([string]$candidate)) {
        return [string]$candidate
      }
    }

    Start-Sleep -Milliseconds 500
  }

  return ''
}

function Get-RelativeRunArtifactPath {
  param(
    [string]$TaskId,
    [string]$RunId,
    [string]$Leaf = ''
  )

  $relative = ".runs/$TaskId/cli/$RunId"
  if ($Leaf) {
    return "$relative/$Leaf"
  }

  return $relative
}

function Get-TmuxSessionName {
  param([int]$IssueId)

  $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
  return "codex-orchestrator-issue-$IssueId-$timestamp"
}

function Test-GitRefExists {
  param(
    [string]$RepoPath,
    [string]$RefName
  )

  & git -C $RepoPath show-ref --verify --quiet $RefName 2>$null
  return $LASTEXITCODE -eq 0
}

function Get-WorktreeBaseRef {
  param([string]$RepoPath)

  if (Test-GitRefExists -RepoPath $RepoPath -RefName 'refs/heads/main') {
    return 'main'
  }

  if (Test-GitRefExists -RepoPath $RepoPath -RefName 'refs/remotes/origin/main') {
    return 'origin/main'
  }

  return 'HEAD'
}

function Ensure-LocalWorktree {
  param(
    [string]$RepoPath,
    [string]$WorktreeRoot,
    [string]$WorktreePath,
    [string]$BranchName
  )

  New-Item -ItemType Directory -Force -Path $WorktreeRoot | Out-Null

  $worktreeGitPath = Join-Path $WorktreePath '.git'
  if (-not (Test-Path $worktreeGitPath)) {
    if (Test-Path $WorktreePath) {
      throw "Worktree path already exists but is not a git worktree: $WorktreePath"
    }

    if (Test-GitRefExists -RepoPath $RepoPath -RefName ("refs/heads/{0}" -f $BranchName)) {
      & git -C $RepoPath worktree add $WorktreePath $BranchName
    } else {
      $baseRef = Get-WorktreeBaseRef -RepoPath $RepoPath
      & git -C $RepoPath worktree add $WorktreePath -b $BranchName $baseRef
    }

    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create local worktree at $WorktreePath."
    }
  }

  & git -C $WorktreePath checkout $BranchName 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to checkout branch $BranchName in worktree $WorktreePath."
  }
}

function Stop-TmuxSessionIfExists {
  param([string]$SessionName)

  if (-not $SessionName) {
    return
  }

  & tmux has-session -t $SessionName 2>$null
  if ($LASTEXITCODE -eq 0) {
    & tmux kill-session -t $SessionName
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to kill tmux session $SessionName during failed local run recovery."
    }
  }
}

function Reset-FailedLocalRunState {
  param(
    [string]$RepoPath,
    [string]$WorktreePath,
    [string]$BranchName,
    [int]$IssueNumber,
    [object]$Registry
  )

  # Recover a failed local run by recreating the issue worktree from the current base ref.
  $existingJob = @($Registry.jobs | Where-Object { [string]$_.issue_number -eq [string]$IssueNumber } | Select-Object -First 1)
  if ($existingJob -and $existingJob.tmux_session) {
    Stop-TmuxSessionIfExists -SessionName ([string]$existingJob.tmux_session)
  }

  $worktreeGitPath = Join-Path $WorktreePath '.git'
  if (Test-Path $worktreeGitPath) {
    & git -C $RepoPath worktree remove --force $WorktreePath
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to remove stale worktree for failed local run recovery: $WorktreePath"
    }
  } elseif (Test-Path $WorktreePath) {
    throw "Worktree recovery requires a git worktree path, but found a plain directory: $WorktreePath"
  }

  if (Test-GitRefExists -RepoPath $RepoPath -RefName ("refs/heads/{0}" -f $BranchName)) {
    $baseRef = Get-WorktreeBaseRef -RepoPath $RepoPath
    & git -C $RepoPath branch -f $BranchName $baseRef 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to reset branch $BranchName during failed local run recovery."
    }
  }

  $Registry.jobs = @($Registry.jobs | Where-Object { [string]$_.issue_number -ne [string]$IssueNumber })
}

function Sync-IncludeFilesToWorktree {
  param(
    [string]$RepoPath,
    [string]$WorktreePath,
    [string[]]$IncludeFiles
  )

  foreach ($relativePath in $IncludeFiles) {
    $normalizedRelativePath = $relativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar).Replace('\', [System.IO.Path]::DirectorySeparatorChar)
    $sourcePath = Join-Path $RepoPath $normalizedRelativePath
    $targetPath = Join-Path $WorktreePath $normalizedRelativePath

    if (-not (Test-Path $sourcePath)) {
      throw "Included dispatch file is missing from repo root: $relativePath"
    }

    $targetParent = Split-Path -Parent $targetPath
    if ($targetParent) {
      New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
    }

    Copy-Item -Path $sourcePath -Destination $targetPath -Force
  }
}

function Get-JsonObjectFromText {
  param(
    [string]$Text
  )

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

$config = Get-RemoteExecutionConfig -Path $WorkerConfigPath
if (-not $config.enabled) {
  throw 'Execution is disabled in ops/remote-execution.yaml.'
}

if ([string]$config.transport -ne 'local_process') {
  throw "Only pure local execution is supported. Set worker.transport to local_process in $WorkerConfigPath."
}

$packetPath = Join-Path 'workspace\issue-packets' ("issue-{0}.md" -f $IssueNumber)
if (-not (Test-Path $packetPath)) {
  throw "Issue packet not found: $packetPath"
}

if (-not (Test-Path $LedgerPath)) {
  throw "Issue ledger not found: $LedgerPath"
}

$issueRow = Get-IssueLedgerRow -Path $LedgerPath -TargetIssueNumber $IssueNumber
if (-not $issueRow) {
  throw "Issue #$IssueNumber is not present in $LedgerPath."
}

$recoverFailedRunRequested = [bool]$RecoverFailedRun -or ($issueRow.state -eq 'ready' -and $issueRow.execution -eq 'failed')

$repoPath = Resolve-ConfigPath -Path $config.repo_path
$worktreeRoot = Resolve-ConfigPath -Path $config.worktree_root
$dispatchRoot = Resolve-ConfigPath -Path $config.dispatch_root

$title = $issueRow.title
$slug = ConvertTo-Slug -Text $title
$branchName = "{0}/issue-{1}-{2}" -f $config.branch_prefix, $IssueNumber, $slug
$taskId = "issue-{0}-{1}" -f $IssueNumber, $slug
$worktreePath = Join-Path $worktreeRoot ("issue-{0}" -f $IssueNumber)
$dispatchPath = Join-Path $dispatchRoot ("issue-{0}.prompt.md" -f $IssueNumber)
$launchScriptPath = Join-Path $dispatchRoot ("issue-{0}.run.sh" -f $IssueNumber)
$tmuxSessionName = Get-TmuxSessionName -IssueId $IssueNumber
$includeFiles = @($config.include_files + ("workspace/issue-packets/issue-{0}.md" -f $IssueNumber) | Select-Object -Unique)

$prompt = @"
You are executing bounded issue packet #$IssueNumber for NautilusTrader.

Read and follow:
- workspace/issue-packets/issue-$IssueNumber.md
- AGENTS.md
- memory/active-context.md
- memory/product-context.md
- memory/repo-map.md
- docs/system-truth/index.md

Constraints:
- work only inside the current worktree branch $branchName
- do not push or merge main
- obey the issue packet's allowed write scope and verification requirements
- leave the repository ready for a local pre-PR review
"@

$registry = Get-RemoteJobsRegistry -Path $RemoteJobsPath

if ($DryRun) {
  [pscustomobject]@{
    issue = $IssueNumber
    branch = $branchName
    task_id = $taskId
    worker = $config.worker_host
    orchestrator = 'codex-orchestrator'
    tmux_session = $tmuxSessionName
    worktree = $worktreePath
    dispatch_prompt = $dispatchPath
    recover_failed_run = $recoverFailedRunRequested
    include_files = $includeFiles
    prompt = $prompt
  } | ConvertTo-Json -Depth 6
  exit 0
}

$orchestratorPath = Resolve-CommandPath -ConfiguredPath $config.codex_orchestrator_bin
if (-not $config.runner) {
  $config.runner = 'rlm'
}

if ($recoverFailedRunRequested) {
  Write-Host ("Recovering failed local run for issue #{0} before re-dispatch." -f $IssueNumber)
  Reset-FailedLocalRunState -RepoPath $repoPath -WorktreePath $worktreePath -BranchName $branchName -IssueNumber $IssueNumber -Registry $registry
}

Ensure-LocalWorktree -RepoPath $repoPath -WorktreeRoot $worktreeRoot -WorktreePath $worktreePath -BranchName $branchName
Sync-IncludeFilesToWorktree -RepoPath $repoPath -WorktreePath $worktreePath -IncludeFiles $includeFiles
New-Item -ItemType Directory -Force -Path $dispatchRoot | Out-Null
Set-Content -Path $dispatchPath -Value $prompt
$relativeDispatchPath = [System.IO.Path]::GetRelativePath($worktreePath, $dispatchPath).Replace('\', '/')
$beforeRunIds = @(Get-RunIdsForTask -WorktreePath $worktreePath -TaskId $taskId)

$launchScript = @"
#!/usr/bin/env bash
set -euo pipefail
cd $(ConvertTo-ShellLiteral -Text $worktreePath)
goal=`$(cat $(ConvertTo-ShellLiteral -Text $relativeDispatchPath))
exec $(ConvertTo-ShellLiteral -Text $orchestratorPath) start $(ConvertTo-ShellLiteral -Text $config.runner) --goal "`$goal" --task $(ConvertTo-ShellLiteral -Text $taskId) --runtime-mode appserver --validator none --no-interactive --format json
"@
Set-Content -Path $launchScriptPath -Value $launchScript
& bash -lc ("chmod +x {0}" -f (ConvertTo-ShellLiteral -Text $launchScriptPath))
if ($LASTEXITCODE -ne 0) {
  throw "Unable to make launch script executable: $launchScriptPath"
}

& tmux has-session -t $tmuxSessionName 2>$null
if ($LASTEXITCODE -eq 0) {
  & tmux kill-session -t $tmuxSessionName
}

$tmuxCommand = "bash -lc " + (ConvertTo-ShellLiteral -Text ("cd {0} && exec {1}" -f (ConvertTo-ShellLiteral -Text $worktreePath), (ConvertTo-ShellLiteral -Text $launchScriptPath)))
& tmux new-session -d -s $tmuxSessionName $tmuxCommand
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to create tmux session for local codex-orchestrator run.'
}

$jobId = Wait-ForNewRunId -WorktreePath $worktreePath -TaskId $taskId -BeforeRunIds $beforeRunIds -TimeoutSeconds 30
if (-not $jobId) {
  $paneOutput = (& tmux capture-pane -pt $tmuxSessionName 2>&1 | Out-String).Trim()
  throw ("Unable to determine local codex-orchestrator run id for issue #{0}. tmux output:{1}{2}" -f $IssueNumber, [Environment]::NewLine, $paneOutput)
}

$manifestRelativePath = Get-RelativeRunArtifactPath -TaskId $taskId -RunId $jobId -Leaf 'manifest.json'
$artifactRootRelativePath = Get-RelativeRunArtifactPath -TaskId $taskId -RunId $jobId
$logRelativePath = Get-RelativeRunArtifactPath -TaskId $taskId -RunId $jobId -Leaf 'runner.ndjson'
$manifestAbsolutePath = Join-Path $worktreePath ($manifestRelativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))

for ($attempt = 0; $attempt -lt 20 -and -not (Test-Path $manifestAbsolutePath); $attempt += 1) {
  Start-Sleep -Milliseconds 500
}

$manifestSummary = ''
if (Test-Path $manifestAbsolutePath) {
  $manifestObject = Get-JsonObjectFromText -Text (Get-Content $manifestAbsolutePath -Raw)
  if ($manifestObject -and $manifestObject.summary) {
    $manifestSummary = [string]$manifestObject.summary
  }
}

$jobRecord = [pscustomobject]@{
  issue_number = $IssueNumber
  title = $title
  packet_path = $packetPath.Replace('\', '/')
  worker_host = $config.worker_host
  repo_path = $repoPath.Replace('\', '/')
  worktree_path = $worktreePath.Replace('\', '/')
  branch = $branchName
  task_id = $taskId
  job_id = $jobId
  tmux_session = $tmuxSessionName
  dispatch_prompt_path = $dispatchPath.Replace('\', '/')
  manifest_path = $manifestRelativePath
  artifact_root = $artifactRootRelativePath
  log_path = $logRelativePath
  execution_status = 'running'
  summary = $manifestSummary
  files_modified = @()
  last_synced_at = (Get-Date).ToString('o')
}

$jobs = @($registry.jobs | Where-Object { [string]$_.issue_number -ne [string]$IssueNumber })
$jobs += $jobRecord
$registry.jobs = $jobs
Save-RemoteJobsRegistry -Path $RemoteJobsPath -Registry $registry

Update-IssueLedgerRow -Path $LedgerPath -TargetIssueNumber $IssueNumber -Updates @{
  Execution = 'running'
  Worker = $config.worker_host
  Job = $jobId
  Branch = $branchName
  Next = 'Wait for local execution'
}

Write-Host ("Dispatched issue #{0} to local codex-orchestrator on {1} as job {2}." -f $IssueNumber, $config.worker_host, $jobId)
