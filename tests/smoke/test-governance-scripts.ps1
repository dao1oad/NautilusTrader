$required = @(
  'scripts\init-project.ps1',
  'scripts\check-governance.ps1',
  'scripts\init-project.sh',
  'scripts\check-governance.sh'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing scripts: " + ($missing -join ', '))
  exit 1
}

$init = Get-Content 'scripts\init-project.ps1' -Raw
$check = Get-Content 'scripts\check-governance.ps1' -Raw
$initSh = Get-Content 'scripts\init-project.sh' -Raw
$checkSh = Get-Content 'scripts\check-governance.sh' -Raw
$prGate = Get-Content '.github\workflows\pr-gate.yml' -Raw

if ($init -notmatch 'gh auth status') {
  Write-Error 'init-project.ps1 must verify GitHub CLI authentication.'
  exit 1
}

if ($check -notmatch 'project-policy.yaml' -or $check -notmatch 'branch protection') {
  Write-Error 'check-governance.ps1 must validate local files and remote branch protection.'
  exit 1
}

if ($check -notmatch 'codex:instruction-stamp' -or $check -notmatch 'SHA256') {
  Write-Error 'check-governance.ps1 must validate AGENTS.md instruction stamps before dispatch.'
  exit 1
}

if ($initSh -notmatch 'gh auth status') {
  Write-Error 'init-project.sh must verify GitHub CLI authentication.'
  exit 1
}

if ($checkSh -notmatch 'project-policy.yaml' -or $checkSh -notmatch 'branch protection') {
  Write-Error 'check-governance.sh must validate local files and remote branch protection.'
  exit 1
}

if ($checkSh -notmatch 'codex:instruction-stamp' -or $checkSh -notmatch 'hashlib\.sha256') {
  Write-Error 'check-governance.sh must validate AGENTS.md instruction stamps before dispatch.'
  exit 1
}

if ($prGate -notmatch 'actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd' -or $prGate -notmatch 'persist-credentials:\s*false') {
  Write-Error 'pr-gate.yml must pin actions/checkout and disable credential persistence to satisfy the repository workflow security policy.'
  exit 1
}
