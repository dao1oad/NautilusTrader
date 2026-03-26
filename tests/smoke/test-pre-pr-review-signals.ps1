$ledgerPath = 'memory\issue-ledger.md'
$originalLedger = Get-Content $ledgerPath -Raw
$issueReviewPath = 'workspace/handoffs/review-resolution-issue-202.md'
$legacyReviewPath = 'workspace/handoffs/review-resolution-212.md'
$eventPath = 'workspace/runbooks/pre-pr-local-review-event.json'
$remoteJobsPath = 'workspace/runbooks/remote-jobs.json'
$originalRemoteJobs = if (Test-Path $remoteJobsPath) { Get-Content $remoteJobsPath -Raw } else { $null }
$prePrCheckScript = Join-Path 'scripts' 'pre-pr-check.ps1'

function Set-ReviewRecord {
  param(
    [string]$Path,
    [string]$Status = 'accepted',
    [switch]$IncludeRemoteFields
  )

  $remoteFields = ''
  if ($IncludeRemoteFields) {
    $remoteFields = @'
- Worker: localhost
- Branch: codex/issue-202-local-review-record-validation
- Job Id: job-202
- Agent Output Summary: Local execution completed and is ready for local review.
'@
  }

  Set-Content -Path $Path -Value @"
# Review Resolution

- Issue: #202
- PR: N/A before PR creation
- Review Type: local pre-PR review
- Reviewer: local-maintainer
- Summary: Focused local review
$remoteFields
- Resolution: Findings resolved before PR.
- Evidence: Verified with focused smoke checks.
- Status: $Status
"@
}

function Invoke-ExpectSuccess {
  param([string]$Message)

  try {
    & $prePrCheckScript `
      -IssueNumber 202 `
      -ChangedFilesOverride @('memory\active-context.md') `
      -EventPayloadPath $eventPath
  } catch {
    Write-Error ($Message + ' :: ' + $_.Exception.Message)
    exit 1
  }
}

function Invoke-ExpectFailure {
  param(
    [string]$Message,
    [string]$ExpectedFragment = 'not accepted'
  )

  try {
    & $prePrCheckScript `
      -IssueNumber 202 `
      -ChangedFilesOverride @('memory\active-context.md') `
      -EventPayloadPath $eventPath
    Write-Error $Message
    exit 1
  } catch {
    if ($_.Exception.Message -notmatch $ExpectedFragment) {
      Write-Error ($Message + ' :: ' + $_.Exception.Message)
      exit 1
    }
  }
}

try {
  Set-Content -Path $ledgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | Execution | Worker | Job | Branch | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #202 | Local review record validation | High | None | ready | No | idle | TBD | TBD | TBD | TBD | Dispatch subagent |
'@
  Set-Content -Path $remoteJobsPath -Value '{"version":1,"jobs":[]}'
  Set-Content -Path $eventPath -Value @'
{
  "pull_request": {
    "number": 212,
    "body": "Linked issue: #202"
  },
  "repository": {
    "full_name": "example/repo"
  }
}
'@

  Set-ReviewRecord -Path $issueReviewPath
  Invoke-ExpectSuccess -Message 'Issue-scoped local review record should pass.'

  Remove-Item -Path $issueReviewPath -Force
  Set-ReviewRecord -Path $legacyReviewPath
  Invoke-ExpectSuccess -Message 'Legacy PR-scoped review record should still pass during migration.'

  Set-ReviewRecord -Path $legacyReviewPath -Status 'pending'
  Invoke-ExpectFailure -Message 'Unaccepted local review status must fail.'

  Set-Content -Path $remoteJobsPath -Value @'
{
  "version": 1,
  "jobs": [
    {
      "issue_number": 202,
      "job_id": "job-202",
      "worker_host": "localhost",
      "branch": "codex/issue-202-local-review-record-validation",
      "execution_status": "awaiting-local-review"
    }
  ]
}
'@

  Set-ReviewRecord -Path $issueReviewPath
  Invoke-ExpectFailure -Message 'Remote execution evidence must include worker, branch, job id, and agent output summary when a job exists.' -ExpectedFragment 'requires Worker, Branch, Job Id, and Agent Output Summary'

  Set-ReviewRecord -Path $issueReviewPath -IncludeRemoteFields
  Invoke-ExpectSuccess -Message 'Issue-scoped local review record should include execution evidence when a job exists.'
} finally {
  Set-Content -Path $ledgerPath -Value $originalLedger
  if ($originalRemoteJobs -ne $null) {
    Set-Content -Path $remoteJobsPath -Value $originalRemoteJobs
  } else {
    Remove-Item -Path $remoteJobsPath -Force -ErrorAction SilentlyContinue
  }
  Remove-Item -Path $eventPath -Force -ErrorAction SilentlyContinue
  Remove-Item -Path $issueReviewPath -Force -ErrorAction SilentlyContinue
  Remove-Item -Path $legacyReviewPath -Force -ErrorAction SilentlyContinue
}
