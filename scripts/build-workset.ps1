[CmdletBinding()]
param(
  [string]$InputPath = 'workspace\runbooks\issues-snapshot.json',
  [string]$RemoteJobsPath = 'workspace\runbooks\remote-jobs.json'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $InputPath)) {
  throw "Issue snapshot not found: $InputPath"
}

function Get-IssueState {
  param(
    [string[]]$Labels,
    [string[]]$Dependencies,
    [hashtable]$OpenIssueNumbers
  )

  $hasOpenDependency = $false
  foreach ($dependency in $Dependencies) {
    if ($OpenIssueNumbers.ContainsKey($dependency)) {
      $hasOpenDependency = $true
      break
    }
  }

  if ($hasOpenDependency) {
    return 'blocked'
  }

  if ($Labels -contains 'blocked') {
    return 'blocked'
  }

  if ($Labels -contains 'needs-clarification') {
    return 'needs-clarification'
  }

  if ($Labels -contains 'parallel-ready') {
    return 'parallel-ready'
  }

  return 'ready'
}

function Get-Dependencies {
  param([string]$Body)

  if (-not $Body) {
    return @()
  }

  $matches = [regex]::Matches($Body, '#(\d+)')
  return @($matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
}

function Get-RemoteJobsRegistry {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    $registry = [pscustomobject]@{
      version = 1
      jobs = @()
    }
    $registry | ConvertTo-Json -Depth 6 | Set-Content -Path $Path
    return $registry
  }

  $raw = Get-Content $Path -Raw
  if (-not $raw.Trim()) {
    $registry = [pscustomobject]@{
      version = 1
      jobs = @()
    }
    $registry | ConvertTo-Json -Depth 6 | Set-Content -Path $Path
    return $registry
  }

  return $raw | ConvertFrom-Json
}

$issues = Get-Content $InputPath -Raw | ConvertFrom-Json
$remoteRegistry = Get-RemoteJobsRegistry -Path $RemoteJobsPath
$remoteJobLookup = @{}
foreach ($job in @($remoteRegistry.jobs)) {
  if ($null -eq $job.issue_number) {
    continue
  }

  $remoteJobLookup[[string]$job.issue_number] = $job
}

$openIssueNumbers = @{}
foreach ($issue in $issues) {
  $openIssueNumbers[[string]$issue.number] = $true
}

$rows = foreach ($issue in $issues) {
  $labels = @($issue.labels)
  $dependencies = Get-Dependencies -Body $issue.body
  $state = Get-IssueState -Labels $labels -Dependencies $dependencies -OpenIssueNumbers $openIssueNumbers
  $parallel = if ($state -eq 'parallel-ready') { 'Yes' } else { 'No' }
  $remoteJob = $remoteJobLookup[[string]$issue.number]
  $execution = if ($remoteJob -and $remoteJob.execution_status) { [string]$remoteJob.execution_status } else { 'idle' }
  $worker = if ($remoteJob -and $remoteJob.worker_host) { [string]$remoteJob.worker_host } else { 'TBD' }
  $jobId = if ($remoteJob -and $remoteJob.job_id) { [string]$remoteJob.job_id } else { 'TBD' }
  $branch = if ($remoteJob -and $remoteJob.branch) { [string]$remoteJob.branch } else { 'TBD' }
  $pr = if ($remoteJob -and $remoteJob.pr_number) { "#$($remoteJob.pr_number)" } else { 'TBD' }

  [pscustomobject]@{
    number = $issue.number
    title = $issue.title
    priority = if ($labels -contains 'critical') { 'Critical' } elseif ($labels -contains 'high') { 'High' } elseif ($labels -contains 'low') { 'Low' } else { 'Medium' }
    dependencies = if ($dependencies.Count -gt 0) { ($dependencies -join ', ') } else { 'None' }
    state = $state
    parallel = $parallel
    execution = $execution
    worker = $worker
    job = $jobId
    branch = $branch
    pr = $pr
    next = if ($execution -eq 'running') {
      'Wait for local execution'
    } elseif ($execution -eq 'awaiting-local-review') {
      'Complete local pre-PR review'
    } elseif ($execution -eq 'failed') {
      'Inspect local job'
    } elseif ($state -eq 'blocked') {
      'Resolve dependency'
    } elseif ($state -eq 'needs-clarification') {
      'Clarify scope'
    } else {
      'Dispatch subagent'
    }
  }
}

$ledger = @(
  '# Issue Ledger',
  '',
  '| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
)

foreach ($row in $rows) {
  $ledger += "| #$($row.number) | $($row.title) | $($row.priority) | $($row.dependencies) | $($row.state) | $($row.parallel) | $($row.execution) | $($row.worker) | $($row.job) | $($row.branch) | $($row.pr) | $($row.next) |"
}

$ledger | Set-Content -Path 'memory\issue-ledger.md'

New-Item -ItemType Directory -Force -Path 'workspace\issue-packets' | Out-Null
Get-ChildItem -Path 'workspace\issue-packets' -File -Filter '*.md' | Remove-Item -Force

foreach ($row in $rows) {
  $packet = @"
# Issue Packet: #$($row.number)

## Issue

- ID: $($row.number)
- Title: $($row.title)
- Priority: $($row.priority)
- Dependencies: $($row.dependencies)

## Goal

Resolve GitHub issue #$($row.number) according to repository policy.

## Constraints

- Follow AGENTS.md
- Respect issue-ledger state
- Do not violate pull-request-only merge policy

## Allowed Write Scope

- Determined by main agent before dispatch

## Forbidden Scope

- Protected main branch
- Shared governance files unless explicitly assigned

## Verification

- Issue-specific tests
- Required smoke checks

## Review Notes

- Local pre-PR review record required before opening PR
"@

  $path = Join-Path 'workspace\issue-packets' ("issue-{0}.md" -f $row.number)
  Set-Content -Path $path -Value $packet
}

Write-Host "Built issue-ledger and issue-packets for $($rows.Count) issues."
