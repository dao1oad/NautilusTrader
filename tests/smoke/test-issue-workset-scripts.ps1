$required = @(
  'scripts\sync-issues.ps1',
  'scripts\build-workset.ps1',
  'scripts\sync-issues.sh',
  'scripts\build-workset.sh',
  'workspace\runbooks\issue-packet-schema.md'
)

$syncIssuesScript = Join-Path 'scripts' 'sync-issues.ps1'
$syncIssuesShellScript = Join-Path 'scripts' 'sync-issues.sh'
$outputPath = Join-Path 'workspace/runbooks' 'test-empty-issues-snapshot.json'
$singleOutputPath = Join-Path 'workspace/runbooks' 'test-single-issue-snapshot.json'
$shellOutputPath = Join-Path 'workspace/runbooks' 'test-shell-single-issue-snapshot.json'

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing issue orchestration files: " + ($missing -join ', '))
  exit 1
}

$sync = Get-Content 'scripts\sync-issues.ps1' -Raw
$workset = Get-Content 'scripts\build-workset.ps1' -Raw
$syncSh = Get-Content 'scripts\sync-issues.sh' -Raw
$worksetSh = Get-Content 'scripts\build-workset.sh' -Raw

if ($sync -notmatch 'gh issue list') {
  Write-Error 'sync-issues.ps1 must pull issues from GitHub.'
  exit 1
}

if ($workset -notmatch 'issue-ledger' -or $workset -notmatch 'issue-packets') {
  Write-Error 'build-workset.ps1 must build the issue ledger and packet outputs.'
  exit 1
}

if ($syncSh -notmatch 'gh issue list') {
  Write-Error 'sync-issues.sh must pull issues from GitHub.'
  exit 1
}

if ($worksetSh -notmatch 'issue-ledger' -or $worksetSh -notmatch 'issue-packets') {
  Write-Error 'build-workset.sh must build the issue ledger and packet outputs.'
  exit 1
}

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
  & $syncIssuesScript -OutputPath $outputPath
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
  & $syncIssuesScript -OutputPath $singleOutputPath
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

if ($IsLinux -or $IsMacOS) {
  $stubDir = Join-Path ([System.IO.Path]::GetTempPath()) ("gh-stub-" + [System.Guid]::NewGuid().ToString('N'))
  $stubGh = Join-Path $stubDir 'gh'
  $originalPath = $env:PATH

  New-Item -ItemType Directory -Path $stubDir | Out-Null
  @'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "issue" && "${2:-}" == "list" ]]; then
  printf '%s\n' '[{"number":6,"title":"Shell issue","labels":[],"assignees":[],"milestone":null,"url":"https://example.com/issues/6","body":"Shell body"}]'
  exit 0
fi

printf 'Unexpected gh invocation: %s\n' "$*" >&2
exit 1
'@ | Set-Content -Path $stubGh -NoNewline

  try {
    chmod +x -- $stubGh
    $env:PATH = $stubDir + [System.IO.Path]::PathSeparator + $originalPath

    if (Test-Path $shellOutputPath) {
      Remove-Item $shellOutputPath -Force
    }

    bash $syncIssuesShellScript --output-path $shellOutputPath
    if ($LASTEXITCODE -ne 0) {
      Write-Error 'sync-issues.sh must succeed when gh returns a single issue.'
      exit 1
    }

    $rawShellPayload = Get-Content $shellOutputPath -Raw
    $shellPayload = $rawShellPayload | ConvertFrom-Json
    $shellItems = @($shellPayload)

    if ($rawShellPayload -notmatch '^\s*\[' -or $shellItems.Count -ne 1 -or $shellItems[0].number -ne 6) {
      Write-Error 'sync-issues.sh must preserve a single GitHub issue as a JSON array with one element.'
      exit 1
    }
  } finally {
    $env:PATH = $originalPath

    if (Test-Path $stubDir) {
      Remove-Item $stubDir -Recurse -Force
    }

    if (Test-Path $shellOutputPath) {
      Remove-Item $shellOutputPath -Force
    }
  }
}
