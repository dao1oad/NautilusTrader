$required = @(
  'scripts\sync-issues.ps1',
  'scripts\build-workset.ps1',
  'scripts\sync-issues.sh',
  'scripts\build-workset.sh',
  'workspace\runbooks\issue-packet-schema.md'
)

$syncIssuesScript = Join-Path 'scripts' 'sync-issues.ps1'
$syncIssuesShellScript = Join-Path 'scripts' 'sync-issues.sh'
$buildWorksetShellScript = Join-Path 'scripts' 'build-workset.sh'
$outputPath = Join-Path 'workspace/runbooks' 'test-empty-issues-snapshot.json'
$singleOutputPath = Join-Path 'workspace/runbooks' 'test-single-issue-snapshot.json'
$shellOutputPath = Join-Path 'workspace/runbooks' 'test-shell-single-issue-snapshot.json'
$shellFailureOutputPath = Join-Path 'workspace/runbooks' 'test-shell-failure-issues-snapshot.json'
$worksetFixturePath = Join-Path 'workspace/runbooks' 'test-preserve-metadata-issues.json'
$ledgerPath = 'memory\issue-ledger.md'
$packetDir = 'workspace\issue-packets'
$originalLedger = if (Test-Path $ledgerPath) { Get-Content $ledgerPath -Raw } else { $null }
$tempRoot = [System.IO.Path]::GetTempPath()
$backupDir = Join-Path $tempRoot ('issue-packets-backup-' + [guid]::NewGuid().ToString())
$powershellExe = if (Get-Command 'powershell' -ErrorAction SilentlyContinue) {
  'powershell'
} elseif (Get-Command 'pwsh' -ErrorAction SilentlyContinue) {
  'pwsh'
} else {
  Write-Error 'Neither powershell nor pwsh is available to run build-workset.ps1.'
  exit 1
}

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing issue orchestration files: " + ($missing -join ', '))
  exit 1
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
if (Test-Path $packetDir) {
  Get-ChildItem -Path $packetDir -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir $_.Name)
  }
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

    if (Test-Path $shellFailureOutputPath) {
      Remove-Item $shellFailureOutputPath -Force
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

    @'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "issue" && "${2:-}" == "list" ]]; then
  printf 'gh failure\n' >&2
  exit 23
fi

printf 'Unexpected gh invocation: %s\n' "$*" >&2
exit 1
'@ | Set-Content -Path $stubGh -NoNewline

    bash $syncIssuesShellScript --output-path $shellFailureOutputPath 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Error 'sync-issues.sh must fail when gh issue list returns a non-zero exit code.'
      exit 1
    }

    if (Test-Path $shellFailureOutputPath) {
      Write-Error 'sync-issues.sh must not write a snapshot when gh issue list fails.'
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

    if (Test-Path $shellFailureOutputPath) {
      Remove-Item $shellFailureOutputPath -Force
    }
  }
}

$preserveFixture = @'
[
  {
    "number": 301,
    "title": "Tracked issue",
    "url": "https://example.com/301",
    "labels": [],
    "assignees": [],
    "milestone": "",
    "body": ""
  }
]
'@

$seedLedger = @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #301 | Tracked issue | Medium | None | ready | No | #55, #56 | Review stacked PRs |
'@

try {
  Set-Content -Path $worksetFixturePath -Value $preserveFixture
  Set-Content -Path $ledgerPath -Value $seedLedger

  & $powershellExe -ExecutionPolicy Bypass -File scripts\build-workset.ps1 -InputPath $worksetFixturePath
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'build-workset.ps1 must succeed when preserving tracked PR metadata.'
    exit 1
  }

  $updatedLedger = Get-Content $ledgerPath -Raw
  if ($updatedLedger -notlike '*| #301 | Tracked issue | Medium | None | ready | No | #55, #56 | Review stacked PRs |*') {
    Write-Error 'build-workset.ps1 must preserve non-default PR and next metadata for active issues.'
    exit 1
  }

  if ($IsLinux -or $IsMacOS) {
    Set-Content -Path $ledgerPath -Value $seedLedger
    bash $buildWorksetShellScript --input-path $worksetFixturePath
    if ($LASTEXITCODE -ne 0) {
      Write-Error 'build-workset.sh must succeed when preserving tracked PR metadata.'
      exit 1
    }

    $updatedShellLedger = Get-Content $ledgerPath -Raw
    if ($updatedShellLedger -notlike '*| #301 | Tracked issue | Medium | None | ready | No | #55, #56 | Review stacked PRs |*') {
      Write-Error 'build-workset.sh must preserve non-default PR and next metadata for active issues.'
      exit 1
    }
  }
} finally {
  Remove-Item -Path $worksetFixturePath -Force -ErrorAction SilentlyContinue

  if ($originalLedger -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $ledgerPath), $originalLedger, [System.Text.UTF8Encoding]::new($false))
  }

  if (Test-Path $packetDir) {
    Get-ChildItem -Path $packetDir -File | Remove-Item -Force
  }

  if (Test-Path $backupDir) {
    Get-ChildItem -Path $backupDir -File | ForEach-Object {
      Copy-Item -Path $_.FullName -Destination (Join-Path $packetDir $_.Name)
    }
    Remove-Item -Path $backupDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
