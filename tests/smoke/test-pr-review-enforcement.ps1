$workflow = Get-Content '.github\workflows\pr-gate.yml' -Raw
$script = Get-Content 'scripts\pre-pr-check.ps1' -Raw

if ($workflow -match '-SkipGitDiff') {
  Write-Error 'pr-gate.yml must not bypass the memory diff check.'
  exit 1
}

if ($workflow -notmatch 'GH_TOKEN') {
  Write-Error 'pr-gate.yml must provide GH_TOKEN for remote review checks.'
  exit 1
}

if ($workflow -notmatch 'pull_request_review') {
  Write-Error 'pr-gate.yml must rerun on pull_request_review events so submitted remote review can unblock the gate.'
  exit 1
}

if ($workflow -notmatch 'submitted') {
  Write-Error 'pr-gate.yml must listen for submitted review events so remote review re-evaluates the PR gate.'
  exit 1
}

if ($workflow -notmatch 'issue_comment') {
  Write-Error 'pr-gate.yml must rerun on PR issue_comment events so Codex comment-only reviews can unblock the gate.'
  exit 1
}

if ($workflow -notmatch 'created') {
  Write-Error 'pr-gate.yml must listen for created issue_comment events so new Codex comments refresh the PR gate.'
  exit 1
}

if ($script -notmatch 'reviewDecision' -or $script -notmatch 'isResolved') {
  Write-Error 'pre-pr-check.ps1 must validate remote review state and thread resolution.'
  exit 1
}

if ($script -notmatch 'Linked issue' -or $script -notmatch 'required_review_actor') {
  Write-Error 'pre-pr-check.ps1 must enforce issue linkage and a configured review actor.'
  exit 1
}

if ($script -notmatch 'review-resolution-' -or $script -notmatch 'review_resolution_recorded') {
  Write-Error 'pre-pr-check.ps1 must enforce review resolution record evidence.'
  exit 1
}

$originalGitHubEventPath = $env:GITHUB_EVENT_PATH
$tempEventPath = Join-Path $env:TEMP 'nautilus-pr-review-event.json'

Set-Content -Path $tempEventPath -Value @'
{
  "pull_request": {
    "number": 2,
    "body": "Linked issue: #1"
  },
  "repository": {
    "full_name": "dao1oad/NautilusTrader"
  }
}
'@

function gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  $joined = $Args -join ' '

  if ($joined -like 'api graphql*') {
    return '{"data":{"repository":{"pullRequest":{"reviewDecision":"REVIEW_REQUIRED","reviewThreads":{"nodes":[]}}}}}'
  }

  if ($joined -eq 'api repos/dao1oad/NautilusTrader/pulls/2/reviews') {
    return '[{"state":"COMMENTED","user":{"login":"chatgpt-codex-connector[bot]"}}]'
  }

  throw ("Unexpected gh invocation: " + $joined)
}

try {
  $env:GITHUB_EVENT_PATH = $tempEventPath
  & 'scripts\pre-pr-check.ps1' -ReviewResolutionFile 'workspace\handoffs\review-resolution-template.md' -ChangedFilesOverride @('memory\active-context.md')
} catch {
  Write-Error 'pre-pr-check.ps1 must accept a submitted remote Codex review from the GitHub Codex connector bot.'
  exit 1
} finally {
  $env:GITHUB_EVENT_PATH = $originalGitHubEventPath

  if (Test-Path $tempEventPath) {
    Remove-Item $tempEventPath -Force
  }

  if (Test-Path Function:\gh) {
    Remove-Item Function:\gh
  }
}

$tempIssueCommentEventPath = Join-Path $env:TEMP 'nautilus-pr-issue-comment-event.json'

Set-Content -Path $tempIssueCommentEventPath -Value @'
{
  "issue": {
    "number": 4,
    "body": "Linked issue: #3",
    "pull_request": {
      "url": "https://api.github.com/repos/dao1oad/NautilusTrader/pulls/4"
    }
  },
  "repository": {
    "full_name": "dao1oad/NautilusTrader"
  },
  "comment": {
    "body": "Codex Review: Didn't find any major issues. Breezy!"
  }
}
'@

function gh {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  $joined = $Args -join ' '

  if ($joined -like 'api graphql*') {
    return '{"data":{"repository":{"pullRequest":{"reviewDecision":"REVIEW_REQUIRED","reviewThreads":{"nodes":[]}}}}}'
  }

  if ($joined -eq 'api repos/dao1oad/NautilusTrader/pulls/4/reviews') {
    return '[]'
  }

  if ($joined -eq 'api repos/dao1oad/NautilusTrader/issues/4/comments') {
    return '[{"body":"Codex Review: Didn''t find any major issues. Breezy!","user":{"login":"chatgpt-codex-connector"}}]'
  }

  throw ("Unexpected gh invocation: " + $joined)
}

try {
  $env:GITHUB_EVENT_PATH = $tempIssueCommentEventPath
  & 'scripts\pre-pr-check.ps1' -ReviewResolutionFile 'workspace\handoffs\review-resolution-template.md' -ChangedFilesOverride @('memory\active-context.md')
} catch {
  Write-Error 'pre-pr-check.ps1 must accept a Codex connector PR comment when no submitted review exists.'
  exit 1
} finally {
  $env:GITHUB_EVENT_PATH = $originalGitHubEventPath

  if (Test-Path $tempIssueCommentEventPath) {
    Remove-Item $tempIssueCommentEventPath -Force
  }

  if (Test-Path Function:\gh) {
    Remove-Item Function:\gh
  }
}
