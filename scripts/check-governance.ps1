[CmdletBinding()]
param(
  [switch]$SkipRemoteChecks,
  [string]$ProjectPolicyPath = 'ops/project-policy.yaml',
  [string]$ReviewGatesPath = 'ops/review-gates.yaml',
  [string]$RemoteExecutionPath = 'ops/remote-execution.yaml',
  [string]$ProtectionDataPath = '',
  [switch]$SkipBootstrapMemorySync
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

function Get-ConfigInteger {
  param(
    [string]$Path,
    [string]$Key,
    [int]$Default = 0
  )

  $value = Get-ConfigValue -Path $Path -Key $Key
  if (-not $value) {
    return $Default
  }

  return [int]$value
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

      if ($line -match ("^\s{{2}}{0}:\s*(.+)$" -f [regex]::Escape($Key))) {
        return $Matches[1].Trim()
      }
    }

    if ($line -match ("^{0}:\s*$" -f [regex]::Escape($Section))) {
      $inSection = $true
    }
  }

  return ''
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

function Get-RequiredStatusCheckBinding {
  param([string]$Path)

  $binding = Get-ConfigValue -Path $Path -Key 'required_status_check_binding'
  if (-not $binding) {
    return 'check_runs'
  }

  return $binding.Trim().ToLowerInvariant()
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

function Get-ExpectedApprovingReviewCount {
  param(
    [string]$PolicyPath,
    [string]$GatesPath
  )

  $singleMaintainerMode = Get-ConfigBoolean -Path $PolicyPath -Key 'single_maintainer_mode_enabled'
  $reviewGateSingleMaintainer = Get-ConfigBoolean -Path $GatesPath -Key 'single_maintainer_mode_enabled'
  if ($singleMaintainerMode -ne $reviewGateSingleMaintainer) {
    throw 'single_maintainer_mode_enabled must match between project policy and review gates.'
  }

  if ($singleMaintainerMode) {
    return Get-ConfigInteger -Path $GatesPath -Key 'single_maintainer_required_approving_review_count' -Default 0
  }

  return Get-ConfigInteger -Path $GatesPath -Key 'required_approving_review_count' -Default 1
}

function Sync-BootstrapMemoryState {
  param([string]$State)

  if ($SkipBootstrapMemorySync) {
    return
  }

  $syncScript = Join-Path 'scripts' 'sync-bootstrap-memory.ps1'
  if (-not (Test-Path $syncScript)) {
    return
  }

  & $syncScript -State $State | Out-Null
}

$required = @(
  'AGENTS.md',
  $ProjectPolicyPath,
  'ops/agent-config.yaml',
  $ReviewGatesPath,
  $RemoteExecutionPath,
  'scripts/dispatch-issue.ps1',
  'scripts/sync-remote-execution.ps1',
  'scripts/prepare-remote-pr.ps1',
  'workspace/runbooks/remote-jobs.json',
  'memory/active-context.md',
  'memory/issue-ledger.md',
  '.github/PULL_REQUEST_TEMPLATE.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  throw ("Missing governance files: " + ($missing -join ', '))
}

if (-not (Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'enforce_pull_request_only')) {
  throw 'project-policy.yaml must enable PR-only merge.'
}

if (-not (Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'require_local_pre_pr_review')) {
  throw 'project-policy.yaml must require local pre-PR review.'
}

if (-not (Get-ConfigBoolean -Path $RemoteExecutionPath -Key 'enabled')) {
  throw 'remote-execution.yaml must enable remote execution.'
}

$workerHost = Get-SectionValue -Path $RemoteExecutionPath -Section 'worker' -Key 'host'
$workerRepoPath = Get-SectionValue -Path $RemoteExecutionPath -Section 'worker' -Key 'repo_path'
$observabilityMode = Get-SectionValue -Path $RemoteExecutionPath -Section 'observability' -Key 'mode'
if (-not $workerHost -or -not $workerRepoPath -or -not $observabilityMode) {
  throw 'remote-execution.yaml must declare worker host, repo path, and observability mode.'
}

if (Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'require_truth_docs') {
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

  if (-not (Get-ConfigBoolean -Path $ProjectPolicyPath -Key 'fail_on_unmapped_production_paths')) {
    throw 'Truth-doc governance must fail on unmapped production paths by default.'
  }
}

$expectedApprovingReviewCount = Get-ExpectedApprovingReviewCount -PolicyPath $ProjectPolicyPath -GatesPath $ReviewGatesPath

if ($SkipRemoteChecks -and -not $ProtectionDataPath) {
  Sync-BootstrapMemoryState -State 'local_validation_complete'
  Write-Host 'Local governance checks passed. Remote branch protection checks skipped.'
  exit 0
}

if ($ProtectionDataPath) {
  if (-not (Test-Path $ProtectionDataPath)) {
    throw "ProtectionDataPath not found: $ProtectionDataPath"
  }

  $protection = Get-Content $ProtectionDataPath -Raw | ConvertFrom-Json
} else {
  $remoteUrl = git remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0) {
    $remoteUrl = ''
  }

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
}

$requiredStatusChecks = $protection.required_status_checks
if (-not $requiredStatusChecks) {
  throw 'Remote protection must require status checks.'
}

$requiredStatusCheckBinding = Get-RequiredStatusCheckBinding -Path $ReviewGatesPath
$actualStatusChecks = @()

switch ($requiredStatusCheckBinding) {
  'check_runs' {
    if ($requiredStatusChecks.checks) {
      $actualStatusChecks += @($requiredStatusChecks.checks | ForEach-Object {
          if ($_.context) { $_.context } elseif ($_.name) { $_.name }
        })
    }

    if (@($actualStatusChecks).Count -lt 1) {
      if ($requiredStatusChecks.contexts -and @($requiredStatusChecks.contexts).Count -gt 0) {
        throw 'Remote protection must bind required status checks via GitHub Actions check-runs, not legacy status contexts.'
      }

      throw 'Remote protection must define at least one required GitHub Actions check-run.'
    }
  }
  default {
    throw "Unsupported required_status_check_binding '$requiredStatusCheckBinding'."
  }
}

$expectedStatusChecks = Get-ConfigList -Path $ReviewGatesPath -Key 'required_status_checks'
foreach ($expectedCheck in $expectedStatusChecks) {
  if ($actualStatusChecks -notcontains $expectedCheck) {
    throw "Remote protection is missing required GitHub Actions check-run '$expectedCheck'."
  }
}

$requiredPullRequestReviews = $protection.required_pull_request_reviews
if ($expectedApprovingReviewCount -gt 0) {
  if (-not $requiredPullRequestReviews) {
    throw 'Remote protection must require pull request reviews.'
  }

  if ([int]$requiredPullRequestReviews.required_approving_review_count -ne $expectedApprovingReviewCount) {
    throw "Remote protection must require exactly $expectedApprovingReviewCount approving review(s)."
  }
} else {
  if ($requiredPullRequestReviews -and [int]$requiredPullRequestReviews.required_approving_review_count -ne 0) {
    throw 'Single-maintainer mode expects zero required approving reviews.'
  }
}

$requireConversationResolution = Get-ConfigBoolean -Path $ReviewGatesPath -Key 'require_pr_conversation_resolution'
if ($requireConversationResolution -and -not $protection.required_conversation_resolution.enabled) {
  throw 'Remote protection must enable required conversation resolution.'
}

if ($protection.allow_force_pushes.enabled) {
  throw 'Remote protection must disable force pushes.'
}

if (-not $protection.enforce_admins.enabled) {
  throw 'Remote protection must enforce protections for admins.'
}

if ($requiredPullRequestReviews) {
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
}

if (-not $ProtectionDataPath) {
  Sync-BootstrapMemoryState -State 'governance_ready'
}

Write-Host 'Local governance files and remote branch protection checks passed.'
