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

$buildWorkflow = Get-Content '.github\workflows\build.yml' -Raw
if ($buildWorkflow -notmatch 'branches:\s*\[main, nightly, develop, test-ci, test-pre-commit\]') {
  Write-Error 'build.yml must target main pushes alongside the existing release and CI branches.'
  exit 1
}

if ($buildWorkflow -notmatch "refs/heads/main") {
  Write-Error 'build.yml must gate main-only supply-chain and release jobs on refs/heads/main.'
  exit 1
}

$codeqlWorkflow = Get-Content '.github\workflows\codeql-analysis.yml' -Raw
if ($codeqlWorkflow -notmatch 'pull_request:\s*\r?\n\s*branches:\s*\[main\]') {
  Write-Error 'codeql-analysis.yml must analyze pull requests targeting main.'
  exit 1
}
