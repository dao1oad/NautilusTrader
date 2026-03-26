[CmdletBinding()]
param(
  [string]$WorkerConfigPath = 'ops/remote-execution.yaml',
  [string]$RepoRoot = '',
  [string]$SessionName = 'agentboard-server'
)

$ErrorActionPreference = 'Stop'

function Get-SectionValue {
  param(
    [string]$Path,
    [string]$Section,
    [string]$Key
  )

  $inSection = $false
  foreach ($line in Get-Content $Path) {
    if ($inSection) {
      if ($line -match '^[A-Za-z0-9_-]+:\s*$') {
        break
      }

      if ($line -match ("^\s{{2}}{0}:\s*(.*)$" -f [regex]::Escape($Key))) {
        return $Matches[1].Trim()
      }
    }

    if ($line -match ("^{0}:\s*$" -f [regex]::Escape($Section))) {
      $inSection = $true
    }
  }

  return ''
}

function ConvertTo-ShellLiteral {
  param([string]$Text)

  if ($null -eq $Text) {
    return "''"
  }

  $replacement = ([string][char]39) + ([string][char]34) + ([string][char]39) + ([string][char]34) + ([string][char]39)
  $escaped = $Text.Replace("'", $replacement)
  return "'" + $escaped + "'"
}

function Test-PortListening {
  param([int]$Port)

  & bash -lc ("ss -ltn | grep -q ':{0} '" -f $Port)
  return $LASTEXITCODE -eq 0
}

if (-not $RepoRoot) {
  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..') | Select-Object -ExpandProperty ProviderPath
}

$bindHost = Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'bind_host'
$bindPort = [int](Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'bind_port')
$agentboardCommand = Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'agentboard_bin'
$agentboardUrl = Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'url'
$logPath = Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'log_path'
$pidPath = Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'pid_path'

if (-not $bindHost) { $bindHost = '127.0.0.1' }
if (-not $bindPort) { $bindPort = 8088 }
if (-not $agentboardCommand) { $agentboardCommand = 'agentboard' }
if (-not $agentboardUrl) { $agentboardUrl = "http://$bindHost`:$bindPort" }
if (-not $logPath) { $logPath = 'workspace/runbooks/agentboard.log' }
if (-not $pidPath) { $pidPath = 'workspace/runbooks/agentboard.pid' }

$absoluteLogPath = Join-Path $RepoRoot ($logPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
$absolutePidPath = Join-Path $RepoRoot ($pidPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $absoluteLogPath) | Out-Null

if (Test-PortListening -Port $bindPort) {
  Set-Content -Path $absolutePidPath -Value 'already-running'
  Write-Host "Agentboard already listening at $agentboardUrl"
  exit 0
}

& tmux has-session -t $SessionName 2>$null
if ($LASTEXITCODE -eq 0) {
  & tmux kill-session -t $SessionName
}

$launchCommand = "cd $(ConvertTo-ShellLiteral -Text $RepoRoot) && export PORT=$bindPort HOSTNAME=$bindHost AGENTBOARD_HOST=localhost && exec $(ConvertTo-ShellLiteral -Text $agentboardCommand) >> $(ConvertTo-ShellLiteral -Text $absoluteLogPath) 2>&1"
$tmuxCommand = "bash -lc " + (ConvertTo-ShellLiteral -Text $launchCommand)
& tmux new-session -d -s $SessionName $tmuxCommand
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to start agentboard tmux session.'
}

for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
  Start-Sleep -Milliseconds 500
  if (Test-PortListening -Port $bindPort) {
    break
  }
}

if (-not (Test-PortListening -Port $bindPort)) {
  $tail = if (Test-Path $absoluteLogPath) { (Get-Content $absoluteLogPath -Tail 40) -join [Environment]::NewLine } else { 'agentboard log is not available yet.' }
  throw ("Agentboard did not start on {0}. Recent log:{1}{2}" -f $agentboardUrl, [Environment]::NewLine, $tail)
}

$sessionPid = & tmux display-message -p -t $SessionName '#{session_pid}'
Set-Content -Path $absolutePidPath -Value $sessionPid
Write-Host "Agentboard listening at $agentboardUrl"
