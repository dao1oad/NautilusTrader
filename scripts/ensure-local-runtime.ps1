[CmdletBinding()]
param(
  [string]$WorkerConfigPath = 'ops/remote-execution.yaml',
  [string]$RepoRoot = '',
  [switch]$SkipDelegationSetup
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

function Ensure-Command {
  param(
    [string]$CommandName,
    [string]$InstallPackage = ''
  )

  $existing = Get-Command $CommandName -ErrorAction SilentlyContinue
  if ($existing) {
    return $existing.Source
  }

  if (-not $InstallPackage) {
    throw "Required command not found on PATH: $CommandName"
  }

  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is required to install $InstallPackage."
  }

  & npm install -g $InstallPackage
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to install npm package $InstallPackage."
  }

  $installed = Get-Command $CommandName -ErrorAction SilentlyContinue
  if (-not $installed) {
    throw "Command $CommandName was not found after installing $InstallPackage."
  }

  return $installed.Source
}

function Test-DelegationConfigured {
  param([string]$TargetRepoRoot)

  $configPath = Join-Path $HOME '.codex/config.toml'
  if (-not (Test-Path $configPath)) {
    return $false
  }

  $content = Get-Content $configPath -Raw
  return $content -match '\[mcp_servers\.delegation\]' -and $content -match 'command\s*=\s*"codex-orchestrator"' -and $content -match 'delegate-server' -and $content -match [regex]::Escape($TargetRepoRoot)
}

if (-not $RepoRoot) {
  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..') | Select-Object -ExpandProperty ProviderPath
}

$null = Ensure-Command -CommandName 'node'
$null = Ensure-Command -CommandName 'npm'
$null = Ensure-Command -CommandName 'tmux'
$null = Ensure-Command -CommandName 'codex'

$orchestratorCommand = Get-SectionValue -Path $WorkerConfigPath -Section 'worker' -Key 'codex_orchestrator_bin'
if (-not $orchestratorCommand) {
  $orchestratorCommand = 'codex-orchestrator'
}
$agentboardCommand = Get-SectionValue -Path $WorkerConfigPath -Section 'observability' -Key 'agentboard_bin'
if (-not $agentboardCommand) {
  $agentboardCommand = 'agentboard'
}

$orchestratorPath = Ensure-Command -CommandName $orchestratorCommand -InstallPackage '@kbediako/codex-orchestrator'
$agentboardPath = Ensure-Command -CommandName $agentboardCommand -InstallPackage '@gbasin/agentboard'

if (-not $SkipDelegationSetup -and -not (Test-DelegationConfigured -TargetRepoRoot $RepoRoot)) {
  & $orchestratorPath delegation setup --repo $RepoRoot --yes
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to configure codex-orchestrator delegation MCP wiring.'
  }
}

[pscustomobject]@{
  repo_root = $RepoRoot
  codex_orchestrator = $orchestratorPath
  agentboard = $agentboardPath
  delegation_configured = Test-DelegationConfigured -TargetRepoRoot $RepoRoot
} | ConvertTo-Json -Depth 4
