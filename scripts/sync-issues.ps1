[CmdletBinding()]
param(
  [string]$OutputPath = 'workspace\runbooks\issues-snapshot.json',
  [int]$Limit = 100
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI is required for issue sync.'
}

$json = gh issue list --limit $Limit --state open --json number,title,labels,assignees,milestone,url,body
if (-not $json) {
  $json = '[]'
}

$items = $json | ConvertFrom-Json
$normalized = foreach ($item in $items) {
  [pscustomobject]@{
    number = $item.number
    title = $item.title
    url = $item.url
    labels = @($item.labels | ForEach-Object { $_.name })
    assignees = @($item.assignees | ForEach-Object { $_.login })
    milestone = if ($item.milestone) { $item.milestone.title } else { '' }
    body = $item.body
  }
}

$parent = Split-Path -Parent $OutputPath
if ($parent) {
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
}

$normalizedList = @($normalized)
$payload = if ($normalizedList.Count -eq 0) { '[]' } else { $normalizedList | ConvertTo-Json -Depth 6 }
$payload | Set-Content -Path $OutputPath
Write-Host "Synced $($normalized.Count) issues to $OutputPath"
