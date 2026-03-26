$required = @(
  'prompts\project-bootstrap-prompt.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing startup prompt files: " + ($missing -join ', '))
  exit 1
}

$prompt = Get-Content 'prompts\project-bootstrap-prompt.md' -Raw
$requiredPhrases = @(
  'doc-truth-registry.yaml',
  'doc-truth-map.yaml',
  'scripts/init-project.ps1',
  'scripts/check-governance.ps1',
  'scripts/init-project.sh',
  'scripts/check-governance.sh',
  'local pre-PR review',
  'minimal confirmation list',
  'copy the template directory'
)

foreach ($phrase in $requiredPhrases) {
  if ($prompt -notmatch [regex]::Escape($phrase)) {
    Write-Error ("Startup prompt is missing phrase: " + $phrase)
    exit 1
  }
}
