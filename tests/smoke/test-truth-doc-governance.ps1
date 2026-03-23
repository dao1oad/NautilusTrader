$required = @(
  'governance\documentation-truth-policy.md',
  'docs\system-truth\index.md',
  'docs\system-truth\architecture.md',
  'docs\system-truth\module-boundaries.md',
  'docs\system-truth\api-contracts.md',
  'docs\system-truth\data-model.md',
  'docs\system-truth\runtime-flows.md',
  'docs\system-truth\integrations.md',
  'ops\doc-truth-registry.yaml',
  'ops\doc-truth-map.yaml'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing truth-doc governance files: " + ($missing -join ', '))
  exit 1
}

$policy = Get-Content 'ops\project-policy.yaml' -Raw
if ($policy -notmatch 'require_truth_docs:\s*true' -or $policy -notmatch 'fail_on_unmapped_production_paths:\s*true') {
  Write-Error 'project-policy.yaml must enable truth-doc enforcement by default.'
  exit 1
}

$prTemplate = Get-Content '.github\PULL_REQUEST_TEMPLATE.md' -Raw
if ($prTemplate -notmatch 'Truth documents updated' -or $prTemplate -notmatch 'Truth doc exemption reason') {
  Write-Error 'PR template must require truth document disclosure.'
  exit 1
}

$script = Get-Content 'scripts\pre-pr-check.ps1' -Raw
if ($script -notmatch 'doc-truth-registry.yaml' -or $script -notmatch 'doc-truth-map.yaml') {
  Write-Error 'pre-pr-check.ps1 must load truth document registry and mapping.'
  exit 1
}
