$required = @(
  'scripts\sync-issues.ps1',
  'scripts\build-workset.ps1',
  'workspace\runbooks\issue-packet-schema.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing issue orchestration files: " + ($missing -join ', '))
  exit 1
}

$sync = Get-Content 'scripts\sync-issues.ps1' -Raw
$workset = Get-Content 'scripts\build-workset.ps1' -Raw

if ($sync -notmatch 'gh issue list') {
  Write-Error 'sync-issues.ps1 must pull issues from GitHub.'
  exit 1
}

if ($workset -notmatch 'issue-ledger' -or $workset -notmatch 'issue-packets') {
  Write-Error 'build-workset.ps1 must build the issue ledger and packet outputs.'
  exit 1
}

$outputPath = 'workspace\runbooks\test-empty-issues-snapshot.json'
if (Test-Path $outputPath) {
  Remove-Item $outputPath -Force
}

function gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  if ($Args.Count -ge 2 -and $Args[0] -eq 'issue' -and $Args[1] -eq 'list') {
    return '[]'
  }

  throw ("Unexpected gh invocation: " + ($Args -join ' '))
}

try {
  & 'scripts\sync-issues.ps1' -OutputPath $outputPath
  if (-not (Test-Path $outputPath)) {
    Write-Error 'sync-issues.ps1 must write an empty snapshot file when zero issues are returned.'
    exit 1
  }
} finally {
  if (Test-Path Function:\gh) {
    Remove-Item Function:\gh
  }

  if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
  }
}

$singleOutputPath = 'workspace\runbooks\test-single-issue-snapshot.json'
if (Test-Path $singleOutputPath) {
  Remove-Item $singleOutputPath -Force
}

function gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  if ($Args.Count -ge 2 -and $Args[0] -eq 'issue' -and $Args[1] -eq 'list') {
    return '[{"number":5,"title":"Single issue","labels":[],"assignees":[],"milestone":null,"url":"https://example.com/issues/5","body":"Issue body"}]'
  }

  throw ("Unexpected gh invocation: " + ($Args -join ' '))
}

try {
  & 'scripts\sync-issues.ps1' -OutputPath $singleOutputPath
  $rawPayload = Get-Content $singleOutputPath -Raw
  $payload = $rawPayload | ConvertFrom-Json
  $items = @($payload)

  if ($rawPayload -notmatch '^\s*\[' -or $items.Count -ne 1 -or $items[0].number -ne 5) {
    Write-Error 'sync-issues.ps1 must preserve a single GitHub issue as a JSON array with one element.'
    exit 1
  }
} finally {
  if (Test-Path Function:\gh) {
    Remove-Item Function:\gh
  }

  if (Test-Path $singleOutputPath) {
    Remove-Item $singleOutputPath -Force
  }
}
