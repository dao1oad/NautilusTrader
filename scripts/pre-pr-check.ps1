[CmdletBinding()]
param(
  [string]$IssueNumber = '',
  [string]$ReviewResolutionFile = '',
  [string[]]$ChangedFilesOverride = @(),
  [string]$ProjectPolicyPath = 'ops/project-policy.yaml',
  [string]$ReviewGatesPath = 'ops/review-gates.yaml',
  [string]$DocTruthRegistryPath = 'ops/doc-truth-registry.yaml',
  [string]$DocTruthMapPath = 'ops/doc-truth-map.yaml',
  [string]$RemoteJobsPath = 'workspace\runbooks\remote-jobs.json',
  [string]$EventPayloadPath = '',
  [switch]$SkipGitDiff
)

$ErrorActionPreference = 'Stop'

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

function Get-ConfigBoolean {
  param(
    [string]$Path,
    [string]$Key
  )

  return (Get-ConfigValue -Path $Path -Key $Key).ToLowerInvariant() -eq 'true'
}

function Get-ConfigList {
  param(
    [string]$Path,
    [string]$Key
  )

  $lines = Get-Content $Path
  $items = @()
  $capture = $false

  foreach ($line in $lines) {
    if ($capture) {
      if ($line -match '^\s*-\s*(.+)$') {
        $items += $Matches[1].Trim()
        continue
      }

      if ($line -match '^\S' -or $line -match '^[A-Za-z0-9_-]+:') {
        break
      }
    }

    if ($line -match ("^\s*{0}:\s*$" -f [regex]::Escape($Key))) {
      $capture = $true
    }
  }

  return $items
}

function Get-DocTruthRegistry {
  param([string]$Path)

  $documents = @()
  $current = $null

  foreach ($line in Get-Content $Path) {
    if ($line -match '^\s*-\s*role:\s*(.+)$') {
      if ($current) {
        $documents += [pscustomobject]$current
      }

      $current = @{
        role = $Matches[1].Trim()
        path = ''
        required = $true
      }
      continue
    }

    if (-not $current) {
      continue
    }

    if ($line -match '^\s*path:\s*(.+)$') {
      $current.path = $Matches[1].Trim()
      continue
    }

    if ($line -match '^\s*required:\s*(true|false)$') {
      $current.required = $Matches[1].Trim().ToLowerInvariant() -eq 'true'
    }
  }

  if ($current) {
    $documents += [pscustomobject]$current
  }

  return $documents
}

function Get-DocTruthMap {
  param([string]$Path)

  $exemptPaths = Get-ConfigList -Path $Path -Key 'exempt_paths'
  $rules = @()
  $current = $null
  $captureRules = $false
  $section = ''

  foreach ($line in Get-Content $Path) {
    if (-not $captureRules) {
      if ($line -match '^\s*rules:\s*$') {
        $captureRules = $true
      }
      continue
    }

    if ($line -match '^\s*-\s*name:\s*(.+)$') {
      if ($current) {
        $rules += [pscustomobject]$current
      }

      $current = @{
        name = $Matches[1].Trim()
        code_paths = @()
        requires = @()
      }
      $section = ''
      continue
    }

    if (-not $current) {
      continue
    }

    if ($line -match '^\s*code_paths:\s*$') {
      $section = 'code_paths'
      continue
    }

    if ($line -match '^\s*requires:\s*$') {
      $section = 'requires'
      continue
    }

    if ($line -match '^\s*-\s*(.+)$') {
      $value = $Matches[1].Trim()
      if ($section -eq 'code_paths') {
        $current.code_paths += $value
      } elseif ($section -eq 'requires') {
        $current.requires += $value
      }
    }
  }

  if ($current) {
    $rules += [pscustomobject]$current
  }

  return [pscustomobject]@{
    exempt_paths = $exemptPaths
    rules = $rules
  }
}

function Normalize-RepoPath {
  param([string]$PathText)

  if (-not $PathText) {
    return ''
  }

  $normalized = $PathText.Replace('\', '/').Trim()
  while ($normalized.StartsWith('./')) {
    $normalized = $normalized.Substring(2)
  }

  return $normalized
}

function Test-PathMatches {
  param(
    [string]$PathText,
    [string[]]$Patterns
  )

  $normalizedPath = Normalize-RepoPath -PathText $PathText
  foreach ($pattern in $Patterns) {
    $normalizedPattern = Normalize-RepoPath -PathText $pattern
    if ($normalizedPath -like $normalizedPattern) {
      return $true
    }
  }

  return $false
}

function Get-ChangedFiles {
  param(
    [string[]]$Override,
    [switch]$SkipGitInspection,
    [object]$PullRequestContext
  )

  if ($Override.Count -gt 0) {
    return @($Override | ForEach-Object { Normalize-RepoPath -PathText $_ } | Select-Object -Unique)
  }

  if ($SkipGitInspection) {
    return @()
  }

  if ($env:GITHUB_ACTIONS -eq 'true' -and $PullRequestContext -and $PullRequestContext.BaseRef) {
    git fetch origin $PullRequestContext.BaseRef --depth=1 | Out-Null
    $changed = git diff --name-only "origin/$($PullRequestContext.BaseRef)...HEAD"
  } else {
    $changed = git diff --name-only
  }

  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to inspect git diff.'
  }

  return @($changed | Where-Object { $_ } | ForEach-Object { Normalize-RepoPath -PathText $_ } | Select-Object -Unique)
}

function Get-EventPayload {
  if ($EventPayloadPath) {
    if (-not (Test-Path $EventPayloadPath)) {
      throw "EventPayloadPath not found: $EventPayloadPath"
    }

    return Get-Content $EventPayloadPath -Raw | ConvertFrom-Json
  }

  if ($env:GITHUB_EVENT_PATH -and (Test-Path $env:GITHUB_EVENT_PATH)) {
    return Get-Content $env:GITHUB_EVENT_PATH -Raw | ConvertFrom-Json
  }

  return $null
}

# Supports pull_request event payloads.
function Get-PullRequestContext {
  $event = Get-EventPayload
  if (-not $event) {
    return $null
  }

  $repoSlug = [string]$event.repository.full_name

  if ($event.pull_request) {
    return [pscustomobject]@{
      Number = [int]$event.pull_request.number
      Body = [string]$event.pull_request.body
      RepoSlug = $repoSlug
      BaseRef = [string]$event.pull_request.base.ref
    }
  }

  return $null
}

function Resolve-IssueNumber {
  param([object]$PullRequestContext)

  if ($IssueNumber) {
    return $IssueNumber.TrimStart('#')
  }

  if ($PullRequestContext -and $PullRequestContext.Body) {
    if ($PullRequestContext.Body -match 'Linked issue:\s*#?(\d+)') {
      return $Matches[1]
    }

    if ($PullRequestContext.Body -match '#(\d+)') {
      return $Matches[1]
    }
  }

  throw 'Linked issue is required for PR validation. Declare `Linked issue: #<number>` in the PR body or pass -IssueNumber explicitly for local verification.'
}

function Resolve-ReviewResolutionPath {
  param(
    [object]$PullRequestContext,
    [string]$ResolvedIssueNumber
  )

  if ($ReviewResolutionFile) {
    return $ReviewResolutionFile
  }

  $candidates = @()
  if ($ResolvedIssueNumber) {
    $candidates += Join-Path 'workspace/handoffs' ("review-resolution-issue-{0}.md" -f $ResolvedIssueNumber)
  }

  if ($PullRequestContext) {
    $candidates += Join-Path 'workspace/handoffs' ("review-resolution-{0}.md" -f $PullRequestContext.Number)
  }

  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw 'local_pre_pr_review requires a checked-in review record. Use workspace/handoffs/review-resolution-issue-<issue>.md or pass -ReviewResolutionFile explicitly.'
}

function Get-ReviewRecordField {
  param(
    [string]$Content,
    [string]$Field
  )

  $pattern = "(?im)^\s*-\s*{0}:\s*(.+?)\s*$" -f [regex]::Escape($Field)
  $match = [regex]::Match($Content, $pattern)
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }

  return ''
}

function Assert-ReviewResolutionRecord {
  param(
    [string]$Path,
    [string]$ExpectedIssueNumber
  )

  if (-not (Test-Path $Path)) {
    throw "Missing review resolution record: $Path"
  }

  $content = Get-Content $Path -Raw
  $issueField = Get-ReviewRecordField -Content $content -Field 'Issue'
  $reviewType = Get-ReviewRecordField -Content $content -Field 'Review Type'
  $resolution = Get-ReviewRecordField -Content $content -Field 'Resolution'
  $evidence = Get-ReviewRecordField -Content $content -Field 'Evidence'
  $status = Get-ReviewRecordField -Content $content -Field 'Status'

  if (-not $issueField -or -not $reviewType -or -not $resolution -or -not $evidence -or -not $status) {
    throw 'Review resolution record must include Issue, Review Type, Resolution, Evidence, and Status fields.'
  }

  if ($ExpectedIssueNumber) {
    if ($issueField -notmatch '#?(\d+)') {
      throw 'Review resolution record Issue field must contain an issue number.'
    }

    if ($Matches[1] -ne $ExpectedIssueNumber) {
      throw "Review resolution record Issue field must match linked issue #$ExpectedIssueNumber."
    }
  }

  $acceptedReviewTypes = Get-ConfigList -Path $ReviewGatesPath -Key 'accepted_local_review_types'
  if (($acceptedReviewTypes | ForEach-Object { $_.ToLowerInvariant() }) -notcontains $reviewType.ToLowerInvariant()) {
    throw "Review resolution record Review Type '$reviewType' is not accepted."
  }

  $acceptedStatuses = Get-ConfigList -Path $ReviewGatesPath -Key 'accepted_local_review_statuses'
  if (($acceptedStatuses | ForEach-Object { $_.ToLowerInvariant() }) -notcontains $status.ToLowerInvariant()) {
    throw "Review resolution record Status '$status' is not accepted."
  }
}

function Get-RemoteJobRecord {
  param(
    [string]$Path,
    [string]$ResolvedIssueNumber
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $raw = Get-Content $Path -Raw
  if (-not $raw.Trim()) {
    return $null
  }

  try {
    $payload = $raw | ConvertFrom-Json
  } catch {
    throw 'remote-jobs.json must contain valid JSON.'
  }

  foreach ($job in @($payload.jobs)) {
    if ([string]$job.issue_number -eq [string]$ResolvedIssueNumber) {
      return $job
    }
  }

  return $null
}

function Assert-RemoteExecutionEvidence {
  param(
    [string]$Path,
    [string]$ExpectedIssueNumber,
    [object]$RemoteJob
  )

  $content = Get-Content $Path -Raw
  $worker = Get-ReviewRecordField -Content $content -Field 'Worker'
  $branch = Get-ReviewRecordField -Content $content -Field 'Branch'
  $jobId = Get-ReviewRecordField -Content $content -Field 'Job Id'
  $outputSummary = Get-ReviewRecordField -Content $content -Field 'Agent Output Summary'

  if (-not $worker -or -not $branch -or -not $jobId -or -not $outputSummary) {
    throw "Issue #$ExpectedIssueNumber has remote execution state and requires Worker, Branch, Job Id, and Agent Output Summary in the local review record."
  }

  if ($RemoteJob.worker_host -and $worker -ne [string]$RemoteJob.worker_host) {
    throw "Review resolution record Worker field must match the execution worker for issue #$ExpectedIssueNumber."
  }

  if ($RemoteJob.branch -and $branch -ne [string]$RemoteJob.branch) {
    throw "Review resolution record Branch field must match the remote execution branch for issue #$ExpectedIssueNumber."
  }

  if ($RemoteJob.job_id -and $jobId -ne [string]$RemoteJob.job_id) {
    throw "Review resolution record Job Id field must match the remote execution job for issue #$ExpectedIssueNumber."
  }
}

function Get-ChangedContext {
  param(
    [string[]]$ChangedFiles,
    [object[]]$Registry,
    [object]$Map
  )

  $truthDocPaths = @($Registry | ForEach-Object { Normalize-RepoPath -PathText $_.path })
  $productionChanged = @()

  foreach ($path in $ChangedFiles) {
    if ($truthDocPaths -contains $path) {
      continue
    }

    if (Test-PathMatches -PathText $path -Patterns $Map.exempt_paths) {
      continue
    }

    $productionChanged += $path
  }

  return [pscustomobject]@{
    truth_doc_paths = $truthDocPaths
    production_changed = @($productionChanged | Select-Object -Unique)
  }
}

function Assert-TruthDocumentSync {
  param(
    [string[]]$ChangedFiles,
    [object[]]$Registry,
    [object]$Map,
    [bool]$FailOnUnmapped
  )

  $context = Get-ChangedContext -ChangedFiles $ChangedFiles -Registry $Registry -Map $Map
  if ($context.production_changed.Count -eq 0) {
    return
  }

  $requiredRoles = @{}
  $unmappedPaths = @()

  foreach ($changedPath in $context.production_changed) {
    $matched = $false

    foreach ($rule in $Map.rules) {
      if (Test-PathMatches -PathText $changedPath -Patterns $rule.code_paths) {
        $matched = $true
        foreach ($role in $rule.requires) {
          $requiredRoles[$role] = $true
        }
      }
    }

    if (-not $matched) {
      $unmappedPaths += $changedPath
    }
  }

  if ($unmappedPaths.Count -gt 0 -and $FailOnUnmapped) {
    throw ("unmapped code path: " + ($unmappedPaths -join ', '))
  }

  $requiredTruthPaths = @()
  foreach ($role in $requiredRoles.Keys) {
    $entry = @($Registry | Where-Object { $_.role -eq $role }) | Select-Object -First 1
    if (-not $entry) {
      throw "invalid-truth-doc-reference: role '$role' is not registered."
    }

    $requiredTruthPaths += Normalize-RepoPath -PathText $entry.path
  }

  $missingTruthUpdates = @()
  foreach ($truthPath in ($requiredTruthPaths | Select-Object -Unique)) {
    if ($ChangedFiles -notcontains $truthPath) {
      $missingTruthUpdates += $truthPath
    }
  }

  if ($missingTruthUpdates.Count -gt 0) {
    throw ("missing-truth-doc-update: " + ($missingTruthUpdates -join ', '))
  }
}

if (-not (Test-Path 'memory/active-context.md') -or -not (Test-Path 'memory/issue-ledger.md')) {
  throw 'Required memory files are missing.'
}

if (-not (Test-Path $ReviewGatesPath)) {
  throw 'Missing review gate configuration.'
}

if (-not (Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'require_local_pre_pr_review')) {
  throw 'Project policy must require local pre-PR review.'
}

$pullRequestContext = Get-PullRequestContext
$resolvedIssueNumber = Resolve-IssueNumber -PullRequestContext $pullRequestContext

$ledger = Get-Content 'memory/issue-ledger.md' -Raw
if ($ledger -notmatch "#$resolvedIssueNumber\b") {
  throw "Linked issue #$resolvedIssueNumber is not present in memory/issue-ledger.md."
}

$requireTruthDocs = Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'require_truth_docs'
$failOnUnmapped = Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'fail_on_unmapped_production_paths'

$truthRegistry = @()
$truthMap = $null
if ($requireTruthDocs) {
  if (-not (Test-Path $DocTruthRegistryPath) -or -not (Test-Path $DocTruthMapPath)) {
    throw 'Truth-doc enforcement is enabled but registry or map is missing.'
  }

  $truthRegistry = Get-DocTruthRegistry -Path $DocTruthRegistryPath
  $truthMap = Get-DocTruthMap -Path $DocTruthMapPath
}

$changed = Get-ChangedFiles -Override $ChangedFilesOverride -SkipGitInspection:$SkipGitDiff -PullRequestContext $pullRequestContext

if (Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'require_memory_updates') {
  $relevantForMemory = if ($requireTruthDocs -and $truthMap) {
    (Get-ChangedContext -ChangedFiles $changed -Registry $truthRegistry -Map $truthMap).production_changed
  } else {
    @($changed | Where-Object { $_ -notmatch '(^|/)memory/' })
  }

  $hasMemoryChange = @($changed | Where-Object { $_ -match '(^|/)memory/' }).Count -gt 0
  if ($relevantForMemory.Count -gt 0 -and -not $hasMemoryChange) {
    throw 'This change set updates no memory files. memory updates are required before PR.'
  }
}

if ($requireTruthDocs) {
  Assert-TruthDocumentSync -ChangedFiles $changed -Registry $truthRegistry -Map $truthMap -FailOnUnmapped $failOnUnmapped
}

$requiredGates = Get-ConfigList -Path $ReviewGatesPath -Key 'required_gates'
if ($requiredGates -contains 'local_pre_pr_review' -or $requiredGates -contains 'review_resolution_recorded') {
  $resolutionPath = Resolve-ReviewResolutionPath -PullRequestContext $pullRequestContext -ResolvedIssueNumber $resolvedIssueNumber
  Assert-ReviewResolutionRecord -Path $resolutionPath -ExpectedIssueNumber $resolvedIssueNumber

  $remoteJob = Get-RemoteJobRecord -Path $RemoteJobsPath -ResolvedIssueNumber $resolvedIssueNumber
  if ($remoteJob) {
    Assert-RemoteExecutionEvidence -Path $resolutionPath -ExpectedIssueNumber $resolvedIssueNumber -RemoteJob $remoteJob
  }
}

Write-Host 'Pre-PR checks passed. Local pre-PR review evidence is recorded.'
