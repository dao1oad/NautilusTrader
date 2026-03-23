$required = @(
  'memory\active-context.md',
  'memory\product-context.md',
  'memory\repo-map.md',
  'memory\decision-log.md',
  'memory\progress-log.md',
  'memory\issue-ledger.md',
  'memory\glossary.md',
  'memory\known-constraints.md',
  'memory\retrospectives\README.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing memory files: " + ($missing -join ', '))
  exit 1
}

$active = Get-Content 'memory\active-context.md' -Raw
if ($active -notmatch 'Current Goal' -or $active -notmatch 'Next Actions') {
  Write-Error 'active-context.md must include Current Goal and Next Actions sections.'
  exit 1
}
