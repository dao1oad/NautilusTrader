[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][int]$IssueNumber,
  [string]$WorkerConfigPath = 'ops/remote-execution.yaml',
  [string]$RemoteJobsPath = 'workspace\runbooks\remote-jobs.json',
  [string]$LedgerPath = 'memory\issue-ledger.md',
  [string]$ReviewResolutionTemplatePath = 'workspace\handoffs\review-resolution-template.md',
  [string]$ReviewResolutionPath = '',
  [string]$JobOutputOverridePath = '',
  [string]$OutputArtifactPath = ''
)

$ErrorActionPreference = 'Stop'

# Execution contract:
# - codex-orchestrator artifacts capture the full local session output
# - review-resolution-issue-<issue>.md is the issue-scoped local review record

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

  return Join-Path $WorktreePath ($ArtifactPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
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

function Build-ArtifactReport {
  param(
    [string]$ManifestPath,
    [string]$RunnerLogPath
  )

  $manifestText = if ($ManifestPath -and (Test-Path $ManifestPath)) { Get-Content $ManifestPath -Raw } else { '{}' }
  $runnerLogText = if ($RunnerLogPath -and (Test-Path $RunnerLogPath)) { Get-Content $RunnerLogPath -Raw } else { '' }

  return @(
    '# Codex Orchestrator Artifact',
    '',
    '## manifest.json',
    '',
    '```json',
    $manifestText,
    '```',
    '',
    '## runner.ndjson',
    '',
    '```jsonl',
    $runnerLogText,
    '```'
  ) -join [Environment]::NewLine
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

function Get-ReviewRecordField {
  param(
    [string]$Content,
    [string]$Field
  )

  $pattern = "(?im)^\s*-\s*{0}:\s*(.*?)\s*$" -f [regex]::Escape($Field)
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }

  return ''
}

function Get-RemoteOutputSummary {
  param(
    [object]$JobRecord,
    [string]$OutputText
  )

  if ($JobRecord.summary) {
    return [string]$JobRecord.summary
  }

  $firstContentLine = @($OutputText -split "\r?\n" | Where-Object { $_.Trim() } | Select-Object -First 1)
  if ($firstContentLine.Count -gt 0) {
    return $firstContentLine[0].Trim()
  }

  return 'Local execution completed. Review the captured output artifact before opening the PR.'
}

$config = Get-RemoteExecutionConfig -Path $WorkerConfigPath
if (-not $config.enabled) {
  throw 'Execution is disabled in ops/remote-execution.yaml.'
}

if ([string]$config.transport -ne 'local_process') {
  throw "Only pure local execution is supported. Set worker.transport to local_process in $WorkerConfigPath."
}

$registry = Get-RemoteJobsRegistry -Path $RemoteJobsPath
$jobRecord = $registry.jobs | Where-Object { [string]$_.issue_number -eq [string]$IssueNumber } | Select-Object -First 1
if (-not $jobRecord) {
  throw "No remote job is registered for issue #$IssueNumber."
}

$outputText = ''
if ($JobOutputOverridePath) {
  if (-not (Test-Path $JobOutputOverridePath)) {
    throw "JobOutputOverridePath not found: $JobOutputOverridePath"
  }

  $outputText = Get-Content $JobOutputOverridePath -Raw
} else {
  $manifestPath = Resolve-ArtifactPath -WorktreePath $jobRecord.worktree_path -ArtifactPath ([string]$jobRecord.manifest_path)
  $runnerLogPath = Resolve-ArtifactPath -WorktreePath $jobRecord.worktree_path -ArtifactPath ([string]$jobRecord.log_path)
  $outputText = Build-ArtifactReport -ManifestPath $manifestPath -RunnerLogPath $runnerLogPath
}

if (-not $OutputArtifactPath) {
  $OutputArtifactPath = Join-Path 'workspace\runbooks' ("remote-output-issue-{0}.md" -f $IssueNumber)
}

$artifactParent = Split-Path -Parent $OutputArtifactPath
if ($artifactParent) {
  New-Item -ItemType Directory -Force -Path $artifactParent | Out-Null
}
Set-Content -Path $OutputArtifactPath -Value $outputText

if (-not $ReviewResolutionPath) {
  $ReviewResolutionPath = Join-Path 'workspace\handoffs' ("review-resolution-issue-{0}.md" -f $IssueNumber)
}

$existingContent = if (Test-Path $ReviewResolutionPath) { Get-Content $ReviewResolutionPath -Raw } else { '' }
$reviewer = Get-ReviewRecordField -Content $existingContent -Field 'Reviewer'
$summary = Get-ReviewRecordField -Content $existingContent -Field 'Summary'
$resolution = Get-ReviewRecordField -Content $existingContent -Field 'Resolution'
$evidence = Get-ReviewRecordField -Content $existingContent -Field 'Evidence'
$status = Get-ReviewRecordField -Content $existingContent -Field 'Status'
$prField = Get-ReviewRecordField -Content $existingContent -Field 'PR'

if (-not $prField) {
  $prField = 'N/A before PR creation'
}
if (-not $resolution) {
  $resolution = 'Pending local pre-PR review.'
}
if (-not $evidence) {
  $evidence = "Local output captured at $OutputArtifactPath"
}
if (-not $status) {
  $status = 'pending'
}

$outputSummary = Get-RemoteOutputSummary -JobRecord $jobRecord -OutputText $outputText

if ($JobOutputOverridePath) {
  $overridePayload = Get-JsonObjectFromText -Text $outputText
  if ($overridePayload) {
    if ($overridePayload.manifest_path) {
      Set-ObjectProperty -Object $jobRecord -Name 'manifest_path' -Value [string]$overridePayload.manifest_path
    }
    if ($overridePayload.log_path) {
      Set-ObjectProperty -Object $jobRecord -Name 'log_path' -Value [string]$overridePayload.log_path
    }
    if ($overridePayload.summary -and -not $jobRecord.summary) {
      $outputSummary = [string]$overridePayload.summary
    }
  }
}

Set-Content -Path $ReviewResolutionPath -Value @"
# Review Resolution

- Issue: #$IssueNumber
- PR: $prField
- Review Type: local pre-PR review
- Worker: $($jobRecord.worker_host)
- Branch: $($jobRecord.branch)
- Job Id: $($jobRecord.job_id)
- Agent Output Summary: $outputSummary
- Reviewer: $reviewer
- Summary: $summary
- Resolution: $resolution
- Evidence: $evidence
- Status: $status
"@

Set-ObjectProperty -Object $jobRecord -Name 'execution_status' -Value 'awaiting-local-review'
Set-ObjectProperty -Object $jobRecord -Name 'output_artifact_path' -Value ($OutputArtifactPath.Replace('\', '/'))
Set-ObjectProperty -Object $jobRecord -Name 'review_resolution_path' -Value ($ReviewResolutionPath.Replace('\', '/'))
Set-ObjectProperty -Object $jobRecord -Name 'summary' -Value $outputSummary
Set-ObjectProperty -Object $jobRecord -Name 'last_synced_at' -Value ((Get-Date).ToString('o'))
Save-RemoteJobsRegistry -Path $RemoteJobsPath -Registry $registry

Update-IssueLedgerRow -Path $LedgerPath -TargetIssueNumber $IssueNumber -Updates @{
  Execution = 'awaiting-local-review'
  Worker = $jobRecord.worker_host
  Job = $jobRecord.job_id
  Branch = $jobRecord.branch
  Next = 'Complete local pre-PR review'
}

Write-Host ("Prepared review evidence for issue #{0}. Run local pre-PR review before opening the PR." -f $IssueNumber)
