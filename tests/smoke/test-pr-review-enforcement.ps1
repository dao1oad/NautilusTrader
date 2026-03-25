$workflow = Get-Content '.github\workflows\pr-gate.yml' -Raw
$script = Get-Content 'scripts\pre-pr-check.ps1' -Raw
$ledgerPath = 'memory\issue-ledger.md'
$originalLedger = Get-Content $ledgerPath -Raw
$prePrCheckScript = Join-Path 'scripts' 'pre-pr-check.ps1'
$localReviewFile = Join-Path 'workspace\handoffs' 'local-review-issue-1.md'
$originalLocalReview = if (Test-Path $localReviewFile) { Get-Content $localReviewFile -Raw } else { $null }
$tempRoot = [System.IO.Path]::GetTempPath()

if ($workflow -match '-SkipGitDiff') {
  Write-Error 'pr-gate.yml must not bypass the memory diff check.'
  exit 1
}

if ($workflow -match 'GH_TOKEN') {
  Write-Error 'pr-gate.yml must not require GH_TOKEN for local review validation.'
  exit 1
}

if ($workflow -notmatch 'pull_request') {
  Write-Error 'pr-gate.yml must continue to validate pull_request events.'
  exit 1
}

if ($workflow -match 'pull_request_review') {
  Write-Error 'pr-gate.yml must not depend on pull_request_review events after removing remote review.'
  exit 1
}

if ($workflow -match 'issue_comment') {
  Write-Error 'pr-gate.yml must not depend on issue_comment events after removing remote review.'
  exit 1
}

if ($workflow -notmatch 'github\.event\.pull_request\.head\.sha') {
  Write-Error 'pr-gate.yml must checkout the PR head SHA during pull_request validation.'
  exit 1
}

if ($script -notmatch 'Linked issue' -or $script -notmatch 'local-review-issue-') {
  Write-Error 'pre-pr-check.ps1 must enforce issue linkage and issue-scoped local review evidence.'
  exit 1
}

if ($script -notmatch 'local_review_recorded' -or $script -notmatch 'required_local_review_status') {
  Write-Error 'pre-pr-check.ps1 must enforce configured local review record evidence.'
  exit 1
}

$originalGitHubEventPath = $env:GITHUB_EVENT_PATH
$tempEventPath = Join-Path $tempRoot 'nautilus-pr-review-event.json'

Set-Content -Path $tempEventPath -Value @'
{
  "pull_request": {
    "number": 2,
    "body": "Linked issue: #1"
  },
  "repository": {
    "full_name": "dao1oad/NautilusTrader"
  }
}
'@

function gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  throw ("gh should not be invoked during local review validation: " + ($Args -join ' '))
}

try {
  Set-Content -Path $ledgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #1 | Review gate smoke validation | High | None | ready | No | TBD | Dispatch subagent |
'@

  Set-Content -Path $localReviewFile -Value @'
# Local PR Review

- Issue: #1
- Review Type: local pre-PR review
- Reviewer: smoke test
- Scope: PR gate validation
- Findings: none
- Resolution: accepted
- Evidence: smoke
- Status: approved
'@

  try {
    $env:GITHUB_EVENT_PATH = $tempEventPath
    & $prePrCheckScript -ChangedFilesOverride @('memory\active-context.md')
  } catch {
    Write-Error ('pre-pr-check.ps1 must accept a valid linked-issue local review record. :: ' + $_.Exception.Message)
    exit 1
  } finally {
    $env:GITHUB_EVENT_PATH = $originalGitHubEventPath
  }

  Set-Content -Path $localReviewFile -Value @'
# Local PR Review

- Issue: #1
- Review Type: local pre-PR review
- Reviewer: smoke test
- Scope: PR gate validation
- Findings: none
- Resolution: accepted
- Evidence: smoke
- Status: pending
'@

  try {
    $env:GITHUB_EVENT_PATH = $tempEventPath
    & $prePrCheckScript -ChangedFilesOverride @('memory\active-context.md')
    Write-Error 'pre-pr-check.ps1 must reject local review records whose status is not approved.'
    exit 1
  } catch {
    if ($_.Exception.Message -notmatch 'required Status') {
      Write-Error ('pre-pr-check.ps1 failed for the wrong reason when local review status is invalid. :: ' + $_.Exception.Message)
      exit 1
    }
  } finally {
    $env:GITHUB_EVENT_PATH = $originalGitHubEventPath
  }
} finally {
  if (Test-Path $tempEventPath) {
    Remove-Item $tempEventPath -Force
  }

  if (Test-Path Function:\gh) {
    Remove-Item Function:\gh
  }

  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $ledgerPath), $originalLedger, [System.Text.UTF8Encoding]::new($false))

  if ($originalLocalReview -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $localReviewFile), $originalLocalReview, [System.Text.UTF8Encoding]::new($false))
  } elseif (Test-Path $localReviewFile) {
    Remove-Item $localReviewFile -Force
  }
}
