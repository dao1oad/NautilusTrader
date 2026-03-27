$required = @(
  'AGENTS.md',
  'governance\charter.md',
  'governance\operating-model.md',
  'governance\branch-policy.md',
  'governance\issue-orchestration.md',
  'governance\pr-review-policy.md',
  'governance\definition-of-ready.md',
  'governance\definition-of-done.md',
  'governance\risk-escalation.md',
  'governance\templates\issue-packet-template.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing governance files: " + ($missing -join ', '))
  exit 1
}

$content = Get-Content AGENTS.md -Raw
if ($content -notmatch 'gpt-5\.4' -or $content -notmatch 'xhigh') {
  Write-Error 'AGENTS.md must pin gpt-5.4 and xhigh for main and sub agents.'
  exit 1
}

$stampMatch = [regex]::Match($content, '^(?:\uFEFF)?<!--\s*codex:instruction-stamp\s+([a-f0-9]{64})\s*-->(?:\r?\n)?')
if (-not $stampMatch.Success) {
  Write-Error 'AGENTS.md must declare a codex instruction stamp header.'
  exit 1
}

$body = $content.Substring($stampMatch.Length)
$hasher = [System.Security.Cryptography.SHA256]::Create()
try {
  $computedStamp = -join ($hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($body)) | ForEach-Object { $_.ToString('x2') })
} finally {
  $hasher.Dispose()
}

if ($stampMatch.Groups[1].Value -ne $computedStamp) {
  Write-Error "AGENTS.md instruction stamp must match the current document body. Expected $computedStamp but found $($stampMatch.Groups[1].Value)."
  exit 1
}

$gitignore = Get-Content '.gitignore' -Raw
if ($gitignore -match '(?m)^AGENTS\.md$') {
  Write-Error '.gitignore must not ignore AGENTS.md, so directory-scoped agent instructions stay reviewable and tracked.'
  exit 1
}
