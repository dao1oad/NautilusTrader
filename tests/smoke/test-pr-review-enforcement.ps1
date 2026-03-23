$workflow = Get-Content '.github\workflows\pr-gate.yml' -Raw
$script = Get-Content 'scripts\pre-pr-check.ps1' -Raw

if ($workflow -match '-SkipGitDiff') {
  Write-Error 'pr-gate.yml must not bypass the memory diff check.'
  exit 1
}

if ($workflow -notmatch 'GH_TOKEN') {
  Write-Error 'pr-gate.yml must provide GH_TOKEN for remote review checks.'
  exit 1
}

if ($workflow -notmatch 'pull_request_review') {
  Write-Error 'pr-gate.yml must rerun on pull_request_review events so approval can unblock the gate.'
  exit 1
}

if ($workflow -notmatch 'submitted') {
  Write-Error 'pr-gate.yml must listen for submitted review events so approval re-evaluates the PR gate.'
  exit 1
}

if ($script -notmatch 'reviewDecision' -or $script -notmatch 'isResolved') {
  Write-Error 'pre-pr-check.ps1 must validate remote review state and thread resolution.'
  exit 1
}

if ($script -notmatch 'Linked issue' -or $script -notmatch 'required_review_actor') {
  Write-Error 'pre-pr-check.ps1 must enforce issue linkage and a configured review actor.'
  exit 1
}

if ($script -notmatch 'review-resolution-' -or $script -notmatch 'review_resolution_recorded') {
  Write-Error 'pre-pr-check.ps1 must enforce review resolution record evidence.'
  exit 1
}
