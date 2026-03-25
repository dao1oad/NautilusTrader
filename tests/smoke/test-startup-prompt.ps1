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
  'local PR review',
  'minimal confirmation list',
  'copy the template directory'
)

foreach ($phrase in $requiredPhrases) {
  if ($prompt -notmatch [regex]::Escape($phrase)) {
    Write-Error ("Startup prompt is missing phrase: " + $phrase)
    exit 1
  }
}

$readme = Get-Content 'README.md' -Raw
$projectInit = Get-Content 'PROJECT_INIT.md' -Raw

if ($readme -notmatch 'project-bootstrap-prompt.md' -or $projectInit -notmatch 'project-bootstrap-prompt.md') {
  Write-Error 'README.md and PROJECT_INIT.md must explain how to use the startup prompt.'
  exit 1
}
