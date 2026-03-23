$fixturePath = 'workspace\runbooks\issues-dependency-fixture.json'
$ledgerPath = 'memory\issue-ledger.md'
$packetDir = 'workspace\issue-packets'
$originalLedger = if (Test-Path $ledgerPath) { Get-Content $ledgerPath -Raw } else { $null }
$backupDir = Join-Path $env:TEMP ('issue-packets-backup-' + [guid]::NewGuid().ToString())

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
if (Test-Path $packetDir) {
  Get-ChildItem -Path $packetDir -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir $_.Name)
  }
}

$fixture = @'
[
  {
    "number": 101,
    "title": "Base issue",
    "url": "https://example.com/101",
    "labels": ["parallel-ready"],
    "assignees": [],
    "milestone": "",
    "body": ""
  },
  {
    "number": 102,
    "title": "Dependent issue",
    "url": "https://example.com/102",
    "labels": ["parallel-ready"],
    "assignees": [],
    "milestone": "",
    "body": "Depends on #101"
  }
]
'@

try {
  Set-Content -Path $fixturePath -Value $fixture
  powershell -ExecutionPolicy Bypass -File scripts\build-workset.ps1 -InputPath $fixturePath
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'build-workset.ps1 failed on dependency fixture.'
    exit 1
  }

  $ledger = Get-Content $ledgerPath -Raw
  if ($ledger -notmatch '\| #102 \| Dependent issue \| .* \| 101 \| blocked \|') {
    Write-Error 'Dependent issue must be blocked when it references an open dependency.'
    exit 1
  }
} finally {
  Remove-Item -Path $fixturePath -Force -ErrorAction SilentlyContinue
  if ($originalLedger -ne $null) {
    Set-Content -Path $ledgerPath -Value $originalLedger
  }

  if (Test-Path $packetDir) {
    Get-ChildItem -Path $packetDir -File | Remove-Item -Force
  }

  if (Test-Path $backupDir) {
    Get-ChildItem -Path $backupDir -File | ForEach-Object {
      Copy-Item -Path $_.FullName -Destination (Join-Path $packetDir $_.Name)
    }
    Remove-Item -Path $backupDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
