[CmdletBinding()]
param(
  [switch]$SkipRemoteChecks,
  [switch]$AutoDispatch,
  [int]$IssueNumber = 0,
  [string]$LedgerPath = 'memory\issue-ledger.md',
  [string]$WorkerConfigPath = 'ops\remote-execution.yaml'
)

$ErrorActionPreference = 'Stop'

# Startup chain:
# - scripts/ensure-local-runtime.ps1
# - scripts/start-local-agentboard.ps1
# - scripts/check-governance.ps1
# - scripts/sync-issues.ps1
# - scripts/build-workset.ps1
# - scripts/sync-remote-execution.ps1

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

function Get-AgentboardAccessSummary {
  param([string]$ConfigPath)

  $defaultUrl = 'http://127.0.0.1:8088'

  if (-not (Test-Path $ConfigPath)) {
    return "Agentboard: $defaultUrl"
  }

  $url = Get-SectionValue -Path $ConfigPath -Section 'observability' -Key 'url'
  if ($url) {
    return "Agentboard: $url"
  }

  $access = Get-SectionValue -Path $ConfigPath -Section 'observability' -Key 'access'
  $bindHost = Get-SectionValue -Path $ConfigPath -Section 'observability' -Key 'bind_host'
  $bindPort = Get-SectionValue -Path $ConfigPath -Section 'observability' -Key 'bind_port'
  if ($access -eq 'local_http' -and $bindHost -and $bindPort) {
    return ("Agentboard: http://{0}:{1}" -f $bindHost, $bindPort)
  }

  return "Agentboard: $defaultUrl"
}

function Invoke-RepoScript {
  param(
    [string]$Name,
    [string[]]$Arguments = @()
  )

  $scriptPath = Join-Path $PSScriptRoot $Name
  if (-not (Test-Path $scriptPath)) {
    throw "Script not found: $scriptPath"
  }

  $powerShellExe = (Get-Process -Id $PID).Path
  & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File $scriptPath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed."
  }
}

function Get-IssueLedgerRows {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Issue Ledger not found: $Path"
  }

  $rows = @()
  foreach ($line in Get-Content $Path) {
    if ($line -notlike '| #*|*') {
      continue
    }

    $cells = @($line.Trim('|').Split('|') | ForEach-Object { $_.Trim() })
    if ($cells.Count -lt 12) {
      continue
    }

    $issueMatch = [regex]::Match($cells[0], '#(\d+)')
    if (-not $issueMatch.Success) {
      continue
    }

    $rows += [pscustomobject]@{
      IssueNumber = [int]$issueMatch.Groups[1].Value
      Title = $cells[1]
      Priority = $cells[2]
      Dependencies = $cells[3]
      State = $cells[4]
      Parallel = $cells[5]
      Execution = $cells[6]
      Worker = $cells[7]
      Job = $cells[8]
      Branch = $cells[9]
      PR = $cells[10]
      Next = $cells[11]
    }
  }

  return $rows
}

function Format-IssueList {
  param([object[]]$Rows)

  if ($Rows.Count -eq 0) {
    return 'none'
  }

  return ($Rows | ForEach-Object { '#{0}' -f $_.IssueNumber }) -join ', '
}

function Get-RecommendedIssue {
  param(
    [object[]]$Rows,
    [int]$ExplicitIssueNumber
  )

  if ($ExplicitIssueNumber -gt 0) {
    return $Rows | Where-Object { $_.IssueNumber -eq $ExplicitIssueNumber } | Select-Object -First 1
  }

  return $Rows |
    Where-Object { $_.State -eq 'ready' -and $_.Execution -eq 'idle' -and $_.Next -eq 'Dispatch subagent' } |
    Select-Object -First 1
}

$checkGovernanceArgs = @()
if ($SkipRemoteChecks) {
  $checkGovernanceArgs += '-SkipRemoteChecks'
}

Invoke-RepoScript -Name 'ensure-local-runtime.ps1' -Arguments @('-WorkerConfigPath', $WorkerConfigPath)
Invoke-RepoScript -Name 'start-local-agentboard.ps1' -Arguments @('-WorkerConfigPath', $WorkerConfigPath)
Invoke-RepoScript -Name 'check-governance.ps1' -Arguments $checkGovernanceArgs
Invoke-RepoScript -Name 'sync-issues.ps1'
Invoke-RepoScript -Name 'build-workset.ps1'

if (-not $SkipRemoteChecks) {
  Invoke-RepoScript -Name 'sync-remote-execution.ps1'
}

$ledgerRows = @(Get-IssueLedgerRows -Path $LedgerPath)
$readyIssues = @($ledgerRows | Where-Object { $_.State -eq 'ready' -and $_.Execution -eq 'idle' })
$blockedIssues = @($ledgerRows | Where-Object { $_.State -eq 'blocked' })
$runningIssues = @($ledgerRows | Where-Object { $_.Execution -in @('running', 'dispatching', 'awaiting-local-review') })
$recommendedIssue = Get-RecommendedIssue -Rows $ledgerRows -ExplicitIssueNumber $IssueNumber

Write-Host 'Issue Ledger summary'
Write-Host ("Ready issues: {0}" -f (Format-IssueList -Rows $readyIssues))
Write-Host ("Blocked issues: {0}" -f (Format-IssueList -Rows $blockedIssues))
Write-Host ("Running issues: {0}" -f (Format-IssueList -Rows $runningIssues))
Write-Host (Get-AgentboardAccessSummary -ConfigPath $WorkerConfigPath)

if ($recommendedIssue) {
  Write-Host ("Recommended issue: #{0} ({1})" -f $recommendedIssue.IssueNumber, $recommendedIssue.Title)
  Write-Host ("Recommended next step: {0}" -f $recommendedIssue.Next)
} else {
  Write-Host 'No issue is ready to Dispatch subagent.'
}

if (-not $AutoDispatch) {
  exit 0
}

if (-not $recommendedIssue) {
  throw 'AutoDispatch requested but no issue is ready to dispatch.'
}

Invoke-RepoScript -Name 'dispatch-issue.ps1' -Arguments @('-IssueNumber', [string]$recommendedIssue.IssueNumber)
Write-Host ("Dispatched issue #{0}. Next: pwsh -NoProfile -File scripts/sync-remote-execution.ps1" -f $recommendedIssue.IssueNumber)
