$script = Get-Content 'scripts\check-governance.ps1' -Raw
$gates = Get-Content 'ops\review-gates.yaml' -Raw
$workflow = Get-Content '.github\workflows\governance-check.yml' -Raw
$checkGovernanceScript = Join-Path 'scripts' 'check-governance.ps1'
$protectionPath = Join-Path ([System.IO.Path]::GetTempPath()) ('nautilus-protection-' + [guid]::NewGuid().ToString() + '.json')

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

if ($gates -notmatch 'single_maintainer_mode_enabled:\s*true' -or $gates -notmatch 'single_maintainer_required_approving_review_count:\s*0') {
  Write-Error 'review-gates.yaml must declare single-maintainer mode and allow a 0-approval branch protection fallback.'
  exit 1
}

Set-Content -Path $protectionPath -Value @'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "governance-check" },
      { "context": "pr-gate" }
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false,
    "required_approving_review_count": 0,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": [],
      "apps": []
    }
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

try {
  & $checkGovernanceScript -ProtectionDataPath $protectionPath
} catch {
  Write-Error 'check-governance.ps1 must honor single-maintainer review settings and allow a remote count of 0 when configured.'
  exit 1
} finally {
  Remove-Item -Path $protectionPath -Force -ErrorAction SilentlyContinue
}
