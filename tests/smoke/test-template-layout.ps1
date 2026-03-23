$required = @(
  'README.md',
  'PROJECT_INIT.md',
  '.gitignore',
  '.editorconfig',
  'governance',
  'memory',
  'ops',
  'scripts',
  'workspace',
  'docs\architecture',
  'docs\reports'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing required paths: " + ($missing -join ', '))
  exit 1
}
