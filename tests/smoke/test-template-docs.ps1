$requiredPhrases = @(
  'main only via pull request',
  'local PR review',
  'issue-ledger',
  'init-project.ps1',
  'check-governance.ps1',
  'init-project.sh',
  'check-governance.sh'
)

$docs = @(
  'README.md',
  'PROJECT_INIT.md'
)

foreach ($doc in $docs) {
  $content = Get-Content $doc -Raw
  foreach ($phrase in $requiredPhrases) {
    if ($content -notmatch [regex]::Escape($phrase)) {
      Write-Error "$doc is missing phrase: $phrase"
      exit 1
    }
  }
}

$readme = Get-Content 'README.md' -Raw
if ($readme -notmatch 'Pull requests should target the `main` branch') {
  Write-Error 'README.md must instruct contributors to open pull requests against main.'
  exit 1
}
