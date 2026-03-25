$ledgerPath = 'memory\issue-ledger.md'
$originalLedger = Get-Content $ledgerPath -Raw
$prePrCheckScript = Join-Path 'scripts' 'pre-pr-check.ps1'
$localReviewFile = Join-Path 'workspace\handoffs' 'local-review-issue-101.md'
$originalLocalReview = if (Test-Path $localReviewFile) { Get-Content $localReviewFile -Raw } else { $null }

function Invoke-ExpectFailure {
  param(
    [string[]]$ChangedFiles,
    [string]$Message
  )

  try {
    & $prePrCheckScript -IssueNumber 101 -LocalReviewFile $localReviewFile -ChangedFilesOverride $ChangedFiles
    Write-Error $Message
    exit 1
  } catch {
    return
  }
}

function Invoke-ExpectSuccess {
  param(
    [string[]]$ChangedFiles,
    [string]$Message
  )

  try {
    & $prePrCheckScript -IssueNumber 101 -LocalReviewFile $localReviewFile -ChangedFilesOverride $ChangedFiles
  } catch {
    Write-Error ($Message + ' :: ' + $_.Exception.Message)
    exit 1
  }
}

try {
  Set-Content -Path $ledgerPath -Value @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #101 | Truth doc validation | High | None | ready | No | TBD | Dispatch subagent |
'@

  Set-Content -Path $localReviewFile -Value @'
# Local PR Review

- Issue: #101
- Review Type: local pre-PR review
- Reviewer: smoke test
- Scope: truth-doc enforcement
- Findings: none
- Resolution: accepted
- Evidence: smoke
- Status: approved
'@

  Invoke-ExpectFailure -ChangedFiles @('scripts\build-workset.ps1', 'memory\active-context.md') -Message 'Production code change without truth-doc update must fail.'
  Invoke-ExpectSuccess -ChangedFiles @('scripts\build-workset.ps1', 'memory\active-context.md', 'docs\system-truth\runtime-flows.md', 'docs\system-truth\architecture.md') -Message 'Mapped production code change with truth-doc update must pass.'
  Invoke-ExpectSuccess -ChangedFiles @('tests\smoke\test-template-layout.ps1') -Message 'Exempt test-only change should pass without truth-doc update.'
  Invoke-ExpectSuccess -ChangedFiles @('docs\plans\2026-03-23-project-governance-design.md') -Message 'Exempt docs-only change should pass without truth-doc update.'
  Invoke-ExpectSuccess -ChangedFiles @('memory\progress-log.md') -Message 'Memory-only change should pass without truth-doc update.'
  Invoke-ExpectFailure -ChangedFiles @('engine\main.ts', 'memory\active-context.md', 'docs\system-truth\runtime-flows.md') -Message 'Unmapped production path must fail by default.'
} finally {
  [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $ledgerPath), $originalLedger, [System.Text.UTF8Encoding]::new($false))

  if ($originalLocalReview -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $localReviewFile), $originalLocalReview, [System.Text.UTF8Encoding]::new($false))
  } elseif (Test-Path $localReviewFile) {
    Remove-Item $localReviewFile -Force
  }
}
