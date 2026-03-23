$smokes = @(
  'tests\smoke\test-template-layout.ps1',
  'tests\smoke\test-governance-files.ps1',
  'tests\smoke\test-memory-files.ps1',
  'tests\smoke\test-ops-config.ps1',
  'tests\smoke\test-governance-scripts.ps1',
  'tests\smoke\test-issue-workset-scripts.ps1',
  'tests\smoke\test-pr-close-loop-scripts.ps1',
  'tests\smoke\test-github-templates.ps1',
  'tests\smoke\test-template-docs.ps1',
  'tests\smoke\test-pr-review-enforcement.ps1',
  'tests\smoke\test-branch-protection-enforcement.ps1',
  'tests\smoke\test-issue-dependency-planning.ps1',
  'tests\smoke\test-truth-doc-governance.ps1',
  'tests\smoke\test-truth-doc-enforcement.ps1',
  'tests\smoke\test-startup-prompt.ps1'
)

$failed = @()
foreach ($test in $smokes) {
  powershell -ExecutionPolicy Bypass -File $test
  if ($LASTEXITCODE -ne 0) {
    $failed += $test
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Smoke suite failed: " + ($failed -join ', '))
  exit 1
}

Write-Host 'Smoke suite passed.'
