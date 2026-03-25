[CmdletBinding()]
param(
  [switch]$SkipRemoteChecks
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

function Get-ConfigInt {
  param(
    [string]$Path,
    [string]$Key,
    [int]$Default = 0
  )

  $value = Get-ConfigValue -Path $Path -Key $Key
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }

  $parsed = 0
  if (-not [int]::TryParse($value, [ref]$parsed)) {
    throw "Configuration key '$Key' in '$Path' must be an integer."
  }

  return $parsed
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
    exempt_paths = Get-ConfigList -Path $Path -Key 'exempt_paths'
    rules = $rules
  }
}

$required = @(
  'AGENTS.md',
  'ops/project-policy.yaml',
  'ops/agent-config.yaml',
  'ops/review-gates.yaml',
  'memory/active-context.md',
  'memory/issue-ledger.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'workspace/handoffs/local-review-template.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  throw ("Missing governance files: " + ($missing -join ', '))
}

$policyPath = 'ops/project-policy.yaml'
if (-not (Get-ConfigBoolean -Path $policyPath -Key 'enforce_pull_request_only')) {
  throw 'project-policy.yaml must enable PR-only merge.'
}

if (-not (Get-ConfigBoolean -Path $policyPath -Key 'require_local_pr_review')) {
  throw 'project-policy.yaml must require local PR review.'
}

if (Get-ConfigBoolean -Path $policyPath -Key 'require_truth_docs') {
  $truthRequired = @(
    'governance/documentation-truth-policy.md',
    'docs/system-truth/index.md',
    'ops/doc-truth-registry.yaml',
    'ops/doc-truth-map.yaml'
  )

  $missingTruth = $truthRequired | Where-Object { -not (Test-Path $_) }
  if ($missingTruth.Count -gt 0) {
    throw ("Missing truth-doc governance files: " + ($missingTruth -join ', '))
  }

  $truthRegistry = Get-DocTruthRegistry -Path 'ops/doc-truth-registry.yaml'
  if ($truthRegistry.Count -eq 0) {
    throw 'doc-truth-registry.yaml must declare at least one truth document.'
  }

  foreach ($entry in $truthRegistry) {
    if ($entry.required -and -not (Test-Path $entry.path)) {
      throw "Required truth document is missing: $($entry.path)"
    }
  }

  $truthMap = Get-DocTruthMap -Path 'ops/doc-truth-map.yaml'
  if ($truthMap.rules.Count -eq 0) {
    throw 'doc-truth-map.yaml must declare at least one mapping rule.'
  }

  if (-not (Get-ConfigBoolean -Path $policyPath -Key 'fail_on_unmapped_production_paths')) {
    throw 'Truth-doc governance must fail on unmapped production paths by default.'
  }
}

if ($SkipRemoteChecks) {
  Write-Host 'Local governance checks passed. Remote branch protection checks skipped.'
  exit 0
}

$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
  throw 'Git remote origin is not configured. Cannot verify branch protection.'
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI is required to verify remote branch protection.'
}

$repoSlug = gh repo view --json nameWithOwner --jq '.nameWithOwner'
if (-not $repoSlug) {
  throw 'Unable to resolve repository slug via gh.'
}

try {
  $protection = gh api "repos/$repoSlug/branches/main/protection" | ConvertFrom-Json
} catch {
  throw 'Remote branch protection is not configured or cannot be read. Verify branch protection on main.'
}

$requiredPullRequestReviews = $protection.required_pull_request_reviews
if (-not $requiredPullRequestReviews) {
  throw 'Remote protection must require pull request reviews.'
}

$expectedApprovingReviewCount = Get-ConfigInt -Path 'ops/review-gates.yaml' -Key 'required_approving_review_count' -Default 1
if ($expectedApprovingReviewCount -lt 0) {
  throw "Configured required_approving_review_count must be 0 or greater."
}

if ($requiredPullRequestReviews.required_approving_review_count -lt $expectedApprovingReviewCount) {
  throw ("Remote protection must require at least {0} approving review(s)." -f $expectedApprovingReviewCount)
}

$requiredStatusChecks = $protection.required_status_checks
if (-not $requiredStatusChecks) {
  throw 'Remote protection must require status checks.'
}

$actualStatusChecks = @()
if ($requiredStatusChecks.contexts) {
  $actualStatusChecks += @($requiredStatusChecks.contexts)
}
if ($requiredStatusChecks.checks) {
  $actualStatusChecks += @($requiredStatusChecks.checks | ForEach-Object {
      if ($_.context) { $_.context } elseif ($_.name) { $_.name }
    })
}
if (@($actualStatusChecks).Count -lt 1) {
  throw 'Remote protection must define at least one required status check.'
}

$expectedStatusChecks = Get-ConfigList -Path 'ops/review-gates.yaml' -Key 'required_status_checks'
foreach ($expectedCheck in $expectedStatusChecks) {
  if ($actualStatusChecks -notcontains $expectedCheck) {
    throw "Remote protection is missing required status check '$expectedCheck'."
  }
}

if (-not $protection.required_conversation_resolution.enabled) {
  throw 'Remote protection must enable required conversation resolution.'
}

if ($protection.allow_force_pushes.enabled) {
  throw 'Remote protection must disable force pushes.'
}

if (-not $protection.enforce_admins.enabled) {
  throw 'Remote protection must enforce protections for admins.'
}

$bypassPullRequestAllowances = $requiredPullRequestReviews.bypass_pull_request_allowances
if ($bypassPullRequestAllowances) {
  $bypassCount = 0
  $bypassCount += @($bypassPullRequestAllowances.users).Count
  $bypassCount += @($bypassPullRequestAllowances.teams).Count
  $bypassCount += @($bypassPullRequestAllowances.apps).Count
  if ($bypassCount -gt 0) {
    throw 'Remote protection must not grant bypass_pull_request_allowances.'
  }
}

Write-Host 'Local governance files and remote branch protection checks passed.'
