$script = Get-Content 'scripts\check-governance.ps1' -Raw
$gates = Get-Content 'ops\review-gates.yaml' -Raw
$workflow = Get-Content '.github\workflows\governance-check.yml' -Raw
$checkGovernanceScript = Join-Path 'scripts' 'check-governance.ps1'

$requiredChecks = @(
  'required_pull_request_reviews',
  'required_status_checks',
  'allow_force_pushes',
  'required_conversation_resolution',
  'bypass_pull_request_allowances'
)

foreach ($check in $requiredChecks) {
  if ($script -notmatch [regex]::Escape($check)) {
    Write-Error "check-governance.ps1 must validate $check."
    exit 1
  }
}

if ($gates -notmatch 'governance-check' -or $gates -notmatch 'pr-gate') {
  Write-Error 'review-gates.yaml must declare governance-check and pr-gate as required status checks.'
  exit 1
}

if ($workflow -notmatch '(?s)jobs:\s+governance-check:') {
  Write-Error 'governance-check.yml must expose a governance-check job so the emitted check context matches branch protection.'
  exit 1
}

if ($gates -notmatch 'required_approving_review_count:\s*0') {
  Write-Error 'review-gates.yaml must allow single-maintainer mode by setting required_approving_review_count to 0 for this repository.'
  exit 1
}

$originalFunctions = @()
if (Test-Path Function:\git) {
  $originalFunctions += 'git'
}
if (Test-Path Function:\gh) {
  $originalFunctions += 'gh'
}

function git {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  $joined = $Args -join ' '
  if ($joined -eq 'remote get-url origin') {
    return 'ssh://git@ssh.github.com:443/dao1oad/NautilusTrader.git'
  }

  throw ("Unexpected git invocation: " + $joined)
}

function gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  $joined = $Args -join ' '

  if ($joined -eq 'repo view --json nameWithOwner --jq .nameWithOwner') {
    return 'dao1oad/NautilusTrader'
  }

  if ($joined -eq 'api repos/dao1oad/NautilusTrader/branches/main/protection') {
    return @'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["governance-check", "pr-gate"]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false,
    "required_approving_review_count": 0
  },
  "enforce_admins": {
    "enabled": true
  },
  "allow_force_pushes": {
    "enabled": false
  },
  "required_conversation_resolution": {
    "enabled": true
  }
}
'@
  }

  throw ("Unexpected gh invocation: " + $joined)
}

try {
  & $checkGovernanceScript
} catch {
  Write-Error 'check-governance.ps1 must honor required_approving_review_count from review-gates.yaml and allow a remote count of 0 when configured.'
  exit 1
} finally {
  if ($originalFunctions -notcontains 'git' -and (Test-Path Function:\git)) {
    Remove-Item Function:\git
  }

  if ($originalFunctions -notcontains 'gh' -and (Test-Path Function:\gh)) {
    Remove-Item Function:\gh
  }
}
