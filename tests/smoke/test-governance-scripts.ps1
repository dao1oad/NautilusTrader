$required = @(
  'scripts\init-project.ps1',
  'scripts\check-governance.ps1'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing scripts: " + ($missing -join ', '))
  exit 1
}

$init = Get-Content 'scripts\init-project.ps1' -Raw
$check = Get-Content 'scripts\check-governance.ps1' -Raw

if ($init -notmatch 'gh auth status') {
  Write-Error 'init-project.ps1 must verify GitHub CLI authentication.'
  exit 1
}

if ($check -notmatch 'project-policy.yaml' -or $check -notmatch 'branch protection') {
  Write-Error 'check-governance.ps1 must validate local files and remote branch protection.'
  exit 1
}
