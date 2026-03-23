$required = @(
  '.github\PULL_REQUEST_TEMPLATE.md',
  '.github\ISSUE_TEMPLATE\feature.yml',
  '.github\ISSUE_TEMPLATE\bug.yml',
  '.github\workflows\governance-check.yml',
  '.github\workflows\pr-gate.yml'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing GitHub templates: " + ($missing -join ', '))
  exit 1
}

$pr = Get-Content '.github\PULL_REQUEST_TEMPLATE.md' -Raw
if ($pr -notmatch 'remote Codex review' -or $pr -notmatch 'memory') {
  Write-Error 'The PR template must require remote Codex review and memory update disclosure.'
  exit 1
}
