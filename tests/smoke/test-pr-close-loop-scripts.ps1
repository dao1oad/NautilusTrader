$required = @(
  'scripts\pre-pr-check.ps1',
  'scripts\close-loop.ps1',
  'workspace\handoffs\review-resolution-template.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing PR scripts: " + ($missing -join ', '))
  exit 1
}

$pre = Get-Content 'scripts\pre-pr-check.ps1' -Raw
$close = Get-Content 'scripts\close-loop.ps1' -Raw

if ($pre -notmatch 'memory' -or $pre -notmatch 'remote Codex review') {
  Write-Error 'pre-pr-check.ps1 must validate memory updates and remote review prerequisites.'
  exit 1
}

if ($close -notmatch 'progress-log' -or $close -notmatch 'active-context') {
  Write-Error 'close-loop.ps1 must update memory after merge.'
  exit 1
}
