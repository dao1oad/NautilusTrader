$ledgerPath = 'memory\issue-ledger.md'
$originalLedger = Get-Content $ledgerPath -Raw
$prePrCheckScript = Join-Path 'scripts' 'pre-pr-check.ps1'
$reviewResolutionFile = Join-Path 'workspace/handoffs' 'review-resolution-template.md'

function Invoke-ExpectFailure {
  param(
    [string[]]$ChangedFiles,
    [string]$Message
  )

  try {
    & $prePrCheckScript -IssueNumber 101 -ReviewResolutionFile $reviewResolutionFile -SkipRemoteReview -ChangedFilesOverride $ChangedFiles
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
    & $prePrCheckScript -IssueNumber 101 -ReviewResolutionFile $reviewResolutionFile -SkipRemoteReview -ChangedFilesOverride $ChangedFiles
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

  Invoke-ExpectFailure -ChangedFiles @('scripts\build-workset.ps1', 'memory\active-context.md') -Message 'Production code change without truth-doc update must fail.'
  Invoke-ExpectSuccess -ChangedFiles @('scripts\build-workset.ps1', 'memory\active-context.md', 'docs\system-truth\runtime-flows.md', 'docs\system-truth\architecture.md') -Message 'Mapped production code change with truth-doc update must pass.'
  Invoke-ExpectSuccess -ChangedFiles @('tests\smoke\test-template-layout.ps1') -Message 'Exempt test-only change should pass without truth-doc update.'
  Invoke-ExpectSuccess -ChangedFiles @('docs\plans\2026-03-23-project-governance-design.md') -Message 'Exempt docs-only change should pass without truth-doc update.'
  Invoke-ExpectSuccess -ChangedFiles @('memory\progress-log.md') -Message 'Memory-only change should pass without truth-doc update.'
  Invoke-ExpectFailure -ChangedFiles @('engine\main.ts', 'memory\active-context.md', 'docs\system-truth\runtime-flows.md') -Message 'Unmapped production path must fail by default.'
} finally {
  Set-Content -Path $ledgerPath -Value $originalLedger
}
