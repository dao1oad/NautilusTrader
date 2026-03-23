$requiredPhrases = @(
  'main only via pull request',
  'remote Codex review',
  'issue-ledger',
  'init-project.ps1',
  'check-governance.ps1'
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
