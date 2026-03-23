[CmdletBinding()]
param(
  [string]$IssueNumber = '',
  [string]$PrNumber = '',
  [string]$Summary = 'Merge completed.'
)

$ErrorActionPreference = 'Stop'

$date = Get-Date -Format 'yyyy-MM-dd'

Add-Content -Path 'memory\progress-log.md' -Value "`n## $date`n`n- $Summary"
Add-Content -Path 'memory\active-context.md' -Value ("`n## Last Merge Update`n`n- {0}: {1}" -f $date, $Summary)

if ($IssueNumber) {
  $lines = Get-Content 'memory\issue-ledger.md'
  $matchPrefix = "| #$IssueNumber |"
  $found = $false
  $updatedLines = foreach ($line in $lines) {
    if ($line.StartsWith($matchPrefix)) {
      $found = $true
      $cells = $line.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
      if ($cells.Count -ge 8) {
        "| {0} | {1} | {2} | {3} | merged | {4} | #{5} | Archived |" -f $cells[0], $cells[1], $cells[2], $cells[3], $cells[5], $PrNumber
      } else {
        $line
      }
    } else {
      $line
    }
  }

  if ($found) {
    Set-Content -Path 'memory\issue-ledger.md' -Value $updatedLines
  } else {
    Add-Content -Path 'memory\issue-ledger.md' -Value ("`n| #{0} | Closed issue | Medium | None | merged | No | #{1} | Archived |" -f $IssueNumber, $PrNumber)
  }
}

Write-Host 'Updated progress-log, active-context, and issue-ledger.'
