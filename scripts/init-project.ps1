[CmdletBinding()]
param(
  [string]$ProjectName = '',
  [string]$Repository = '',
  [switch]$SkipRemoteChecks
)

$ErrorActionPreference = 'Stop'

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Assert-Command -Name 'git'
Assert-Command -Name 'gh'

gh auth status | Out-Null

Write-Host 'Bootstrap checks passed.'

if ($ProjectName) {
  $productContext = Get-Content 'memory\product-context.md' -Raw
  if ($productContext -notmatch [regex]::Escape($ProjectName)) {
    Add-Content -Path 'memory\product-context.md' -Value "`n## Project Name`n`n- $ProjectName"
  }
}

if ($Repository) {
  $activeContext = Get-Content 'memory\active-context.md' -Raw
  if ($activeContext -notmatch [regex]::Escape($Repository)) {
    Add-Content -Path 'memory\active-context.md' -Value "`n## Repository`n`n- $Repository"
  }
}

Write-Host 'Remote hardening checklist:'
Write-Host '- Enable branch protection on main'
Write-Host '- Require pull request before merge'
Write-Host '- Require required checks'
Write-Host '- Require local pre-PR review before opening pull requests'
Write-Host '- Bind ops/doc-truth-registry.yaml to the project truth documents'
Write-Host '- Bind ops/doc-truth-map.yaml to the project code layout'

if (-not $SkipRemoteChecks) {
  Write-Host 'Run scripts/check-governance.ps1 after binding the GitHub repository.'
}
