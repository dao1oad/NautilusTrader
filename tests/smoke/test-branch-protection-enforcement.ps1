$script = Get-Content 'scripts\check-governance.ps1' -Raw
$gates = Get-Content 'ops\review-gates.yaml' -Raw

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
