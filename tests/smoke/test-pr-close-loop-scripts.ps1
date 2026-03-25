$required = @(
  'scripts\pre-pr-check.ps1',
  'scripts\close-loop.ps1',
  'scripts\close-loop.sh',
  'workspace\handoffs\local-review-template.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing PR scripts: " + ($missing -join ', '))
  exit 1
}

$pre = Get-Content 'scripts\pre-pr-check.ps1' -Raw
$close = Get-Content 'scripts\close-loop.ps1' -Raw
$closeSh = Get-Content 'scripts\close-loop.sh' -Raw

if ($pre -notmatch 'memory' -or $pre -notmatch 'local review') {
  Write-Error 'pre-pr-check.ps1 must validate memory updates and local review prerequisites.'
  exit 1
}

if ($close -notmatch 'progress-log' -or $close -notmatch 'active-context') {
  Write-Error 'close-loop.ps1 must update memory after merge.'
  exit 1
}

if ($closeSh -notmatch 'progress-log' -or $closeSh -notmatch 'active-context') {
  Write-Error 'close-loop.sh must update memory after merge.'
  exit 1
}

$ledgerPath = 'memory\issue-ledger.md'
$progressLogPath = 'memory\progress-log.md'
$activeContextPath = 'memory\active-context.md'
$originalLedger = if (Test-Path $ledgerPath) { Get-Content $ledgerPath -Raw } else { $null }
$originalProgressLog = if (Test-Path $progressLogPath) { Get-Content $progressLogPath -Raw } else { $null }
$originalActiveContext = if (Test-Path $activeContextPath) { Get-Content $activeContextPath -Raw } else { $null }

$seedLedger = @'
# Issue Ledger

| Issue | Title | Priority | Dependencies | State | Parallel | PR | Next |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #401 | Preserve PR metadata | Medium | None | ready | No | #77 | Review complete |
'@

$seedProgressLog = @'
# Progress Log
'@

$seedActiveContext = @'
# Active Context
'@

$powershellExe = if (Get-Command 'powershell' -ErrorAction SilentlyContinue) {
  'powershell'
} elseif (Get-Command 'pwsh' -ErrorAction SilentlyContinue) {
  'pwsh'
} else {
  Write-Error 'Neither powershell nor pwsh is available to run close-loop.ps1.'
  exit 1
}

try {
  Set-Content -Path $ledgerPath -Value $seedLedger
  Set-Content -Path $progressLogPath -Value $seedProgressLog
  Set-Content -Path $activeContextPath -Value $seedActiveContext

  & $powershellExe -ExecutionPolicy Bypass -File scripts\close-loop.ps1 -IssueNumber 401 -Summary 'Closed without explicit PR number'
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'close-loop.ps1 must succeed without an explicit PR number.'
    exit 1
  }

  $updatedLedger = Get-Content $ledgerPath -Raw
  if ($updatedLedger -notlike '*| #401 | Preserve PR metadata | Medium | None | merged | No | #77 | Archived |*') {
    Write-Error 'close-loop.ps1 must preserve existing PR metadata when PrNumber is omitted.'
    exit 1
  }

  if ($IsLinux -or $IsMacOS) {
    Set-Content -Path $ledgerPath -Value $seedLedger
    Set-Content -Path $progressLogPath -Value $seedProgressLog
    Set-Content -Path $activeContextPath -Value $seedActiveContext

    bash scripts/close-loop.sh --issue-number 401 --summary 'Closed without explicit PR number'
    if ($LASTEXITCODE -ne 0) {
      Write-Error 'close-loop.sh must succeed without an explicit PR number.'
      exit 1
    }

    $updatedShellLedger = Get-Content $ledgerPath -Raw
    if ($updatedShellLedger -notlike '*| #401 | Preserve PR metadata | Medium | None | merged | No | #77 | Archived |*') {
      Write-Error 'close-loop.sh must preserve existing PR metadata when --pr-number is omitted.'
      exit 1
    }
  }
} finally {
  if ($originalLedger -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $ledgerPath), $originalLedger, [System.Text.UTF8Encoding]::new($false))
  }

  if ($originalProgressLog -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $progressLogPath), $originalProgressLog, [System.Text.UTF8Encoding]::new($false))
  }

  if ($originalActiveContext -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $activeContextPath), $originalActiveContext, [System.Text.UTF8Encoding]::new($false))
  }
}
