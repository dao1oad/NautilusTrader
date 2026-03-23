[CmdletBinding()]
param(
  [string]$IssueNumber = '',
  [string]$ReviewResolutionFile = '',
  [string[]]$ChangedFilesOverride = @(),
  [switch]$SkipGitDiff,
  [switch]$SkipRemoteReview
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
    [switch]$SkipGitInspection
  )

  if ($Override.Count -gt 0) {
    return @($Override | ForEach-Object { Normalize-RepoPath -PathText $_ } | Select-Object -Unique)
  }

  if ($SkipGitInspection) {
    return @()
  }

  if ($env:GITHUB_ACTIONS -eq 'true' -and $env:GITHUB_BASE_REF) {
    git fetch origin $env:GITHUB_BASE_REF --depth=1 | Out-Null
    $changed = git diff --name-only "origin/$env:GITHUB_BASE_REF...HEAD"
  } else {
    $changed = git diff --name-only
  }

  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to inspect git diff.'
  }

  return @($changed | Where-Object { $_ } | ForEach-Object { Normalize-RepoPath -PathText $_ } | Select-Object -Unique)
}

function Get-PullRequestContext {
  if ($env:GITHUB_EVENT_PATH -and (Test-Path $env:GITHUB_EVENT_PATH)) {
    $event = Get-Content $env:GITHUB_EVENT_PATH -Raw | ConvertFrom-Json
    if ($event.pull_request) {
      return [pscustomobject]@{
        Number = [int]$event.pull_request.number
        Body = [string]$event.pull_request.body
        RepoSlug = [string]$event.repository.full_name
      }
    }

    if ($event.issue -and $event.issue.pull_request) {
      return [pscustomobject]@{
        Number = [int]$event.issue.number
        Body = [string]$event.issue.body
        RepoSlug = [string]$event.repository.full_name
      }
    }
  }

  return $null
}

function Resolve-IssueNumber {
  param(
    [string]$ExplicitIssueNumber,
    [object]$PullRequestContext
  )

  if ($ExplicitIssueNumber) {
    return $ExplicitIssueNumber.TrimStart('#')
  }

  if ($PullRequestContext -and $PullRequestContext.Body) {
    if ($PullRequestContext.Body -match 'Linked issue:\s*#?(\d+)') {
      return $Matches[1]
    }

    if ($PullRequestContext.Body -match '#(\d+)') {
      return $Matches[1]
    }
  }

  throw 'Linked issue is required for PR validation.'
}

function Resolve-ReviewResolutionPath {
  param(
    [string]$ExplicitPath,
    [object]$PullRequestContext
  )

  if ($ExplicitPath) {
    return $ExplicitPath
  }

  if ($PullRequestContext) {
    return Join-Path 'workspace/handoffs' ("review-resolution-{0}.md" -f $PullRequestContext.Number)
  }

  throw 'review_resolution_recorded requires a review-resolution-<pr>.md file.'
}

function Assert-ReviewResolutionRecord {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Missing review resolution record: $Path"
  }

  $content = Get-Content $Path -Raw
  if ($content -notmatch 'Status:' -or $content -notmatch 'Resolution:') {
    throw 'Review resolution record must include Status and Resolution fields.'
  }
}

function Assert-RemoteReview {
  param(
    [object]$PullRequestContext,
    [string]$RequiredActor
  )

  if (-not $PullRequestContext) {
    throw 'Remote review checks require pull request context.'
  }

  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI is required for remote review validation.'
  }

  $repoParts = $PullRequestContext.RepoSlug.Split('/')
  $owner = $repoParts[0]
  $name = $repoParts[1]
  $prNumber = $PullRequestContext.Number

  $query = @'
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewDecision
      reviewThreads(first: 100) {
        nodes {
          isResolved
        }
      }
    }
  }
}
'@

  $graphql = gh api graphql -f query="$query" -F owner="$owner" -F name="$name" -F number="$prNumber" | ConvertFrom-Json
  $pullRequest = $graphql.data.repository.pullRequest
  if (-not $pullRequest) {
    throw 'Unable to read pull request review state.'
  }

  $unresolvedThreads = @($pullRequest.reviewThreads.nodes | Where-Object { -not $_.isResolved })
  if ($unresolvedThreads.Count -gt 0) {
    throw 'Remote review contains unresolved threads. Resolve all review comments before merge.'
  }

  $reviews = gh api "repos/$($PullRequestContext.RepoSlug)/pulls/$prNumber/reviews" | ConvertFrom-Json
  $acceptedActors = @($RequiredActor)
  if ($RequiredActor -eq 'codex') {
    $acceptedActors += @('chatgpt-codex-connector', 'chatgpt-codex-connector[bot]')
  }

  $acceptedStates = @('COMMENTED', 'APPROVED', 'CHANGES_REQUESTED')
  $actorReviews = @($reviews | Where-Object {
      $acceptedStates -contains $_.state -and $acceptedActors -contains $_.user.login
    })

  if ($actorReviews.Count -gt 0) {
    return
  }

  $issueComments = gh api "repos/$($PullRequestContext.RepoSlug)/issues/$prNumber/comments" | ConvertFrom-Json
  $actorIssueComments = @($issueComments | Where-Object {
      $acceptedActors -contains $_.user.login -and $_.body -match 'Codex Review'
    })

  if ($actorIssueComments.Count -eq 0) {
    throw "No remote Codex review signal found from configured actor '$RequiredActor'. Current reviewDecision is '$($pullRequest.reviewDecision)'."
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

if (-not (Test-Path 'ops/review-gates.yaml')) {
  throw 'Missing review gate configuration.'
}

$policyPath = 'ops/project-policy.yaml'
$policy = Get-Content $policyPath -Raw
if ($policy -notmatch 'require_remote_codex_review:\s*true') {
  throw 'Project policy must require remote Codex review.'
}

$pullRequestContext = Get-PullRequestContext
$resolvedIssueNumber = Resolve-IssueNumber -ExplicitIssueNumber $IssueNumber -PullRequestContext $pullRequestContext

$ledger = Get-Content 'memory/issue-ledger.md' -Raw
if ($ledger -notmatch "#$resolvedIssueNumber\b") {
  throw "Linked issue #$resolvedIssueNumber is not present in memory/issue-ledger.md."
}

$requireTruthDocs = Get-ConfigBoolean -Path $policyPath -Key 'require_truth_docs'
$failOnUnmapped = Get-ConfigBoolean -Path $policyPath -Key 'fail_on_unmapped_production_paths'

$truthRegistry = @()
$truthMap = $null
if ($requireTruthDocs) {
  if (-not (Test-Path 'ops/doc-truth-registry.yaml') -or -not (Test-Path 'ops/doc-truth-map.yaml')) {
    throw 'Truth-doc enforcement is enabled but registry or map is missing.'
  }

  $truthRegistry = Get-DocTruthRegistry -Path 'ops/doc-truth-registry.yaml'
  $truthMap = Get-DocTruthMap -Path 'ops/doc-truth-map.yaml'
}

$changed = Get-ChangedFiles -Override $ChangedFilesOverride -SkipGitInspection:$SkipGitDiff

if (Get-ConfigBoolean -Path $policyPath -Key 'require_memory_updates') {
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

if (-not $SkipRemoteReview) {
  $requiredActor = Get-ConfigValue -Path 'ops/review-gates.yaml' -Key 'required_review_actor'
  if (-not $requiredActor) {
    throw 'review-gates.yaml must define required_review_actor.'
  }

  Assert-RemoteReview -PullRequestContext $pullRequestContext -RequiredActor $requiredActor
}

$requiredGates = Get-ConfigList -Path 'ops/review-gates.yaml' -Key 'required_gates'
if ($requiredGates -contains 'review_resolution_recorded') {
  $resolutionPath = Resolve-ReviewResolutionPath -ExplicitPath $ReviewResolutionFile -PullRequestContext $pullRequestContext
  Assert-ReviewResolutionRecord -Path $resolutionPath
}

Write-Host 'Pre-PR checks passed. Remote Codex review is still required before merge.'
