$fixturePath = 'workspace\runbooks\issues-dependency-fixture.json'
$shellFixturePath = $fixturePath -replace '\\', '/'
$ledgerPath = 'memory\issue-ledger.md'
$packetDir = 'workspace\issue-packets'
$originalLedger = if (Test-Path $ledgerPath) { Get-Content $ledgerPath -Raw } else { $null }
$tempRoot = [System.IO.Path]::GetTempPath()
$backupDir = Join-Path $tempRoot ('issue-packets-backup-' + [guid]::NewGuid().ToString())
$powershellExe = if (Get-Command 'powershell' -ErrorAction SilentlyContinue) {
  'powershell'
} elseif (Get-Command 'pwsh' -ErrorAction SilentlyContinue) {
  'pwsh'
} else {
  Write-Error 'Neither powershell nor pwsh is available to run build-workset.ps1.'
  exit 1
}

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
  },
  {
    "number": 103,
    "title": "Parent reference only",
    "url": "https://example.com/103",
    "labels": ["parallel-ready"],
    "assignees": [],
    "milestone": "",
    "body": "## Parent`n`n- #101"
  },
  {
    "number": 104,
    "title": "Umbrella issue",
    "url": "https://example.com/104",
    "labels": [],
    "assignees": [],
    "milestone": "",
    "body": "## Child issues`n`n- #101`n- #102"
  }
]
'@

try {
  Set-Content -Path $fixturePath -Value $fixture
  & $powershellExe -ExecutionPolicy Bypass -File scripts\build-workset.ps1 -InputPath $fixturePath
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'build-workset.ps1 failed on dependency fixture.'
    exit 1
  }

  $ledger = Get-Content $ledgerPath -Raw
  if ($ledger -notmatch '\| #102 \| Dependent issue \| .* \| 101 \| blocked \|') {
    Write-Error 'Dependent issue must be blocked when it references an open dependency.'
    exit 1
  }

  if ($ledger -notmatch '\| #103 \| Parent reference only \| .* \| None \| parallel-ready \|') {
    Write-Error 'Parent references must not be treated as execution dependencies.'
    exit 1
  }

  if ($ledger -notmatch '\| #104 \| Umbrella issue \| .* \| None \| ready \|') {
    Write-Error 'Child issue references must not be treated as execution dependencies.'
    exit 1
  }

  if ($IsLinux -or $IsMacOS) {
    & bash scripts/build-workset.sh --input-path $shellFixturePath
    if ($LASTEXITCODE -ne 0) {
      Write-Error 'build-workset.sh failed on dependency fixture.'
      exit 1
    }

    $shellLedger = Get-Content $ledgerPath -Raw
    if ($shellLedger -notmatch '\| #102 \| Dependent issue \| .* \| 101 \| blocked \|') {
      Write-Error 'Shell build-workset must block issues that reference an open dependency.'
      exit 1
    }

    if ($shellLedger -notmatch '\| #103 \| Parent reference only \| .* \| None \| parallel-ready \|') {
      Write-Error 'Shell build-workset must ignore Parent references when planning dependencies.'
      exit 1
    }

    if ($shellLedger -notmatch '\| #104 \| Umbrella issue \| .* \| None \| ready \|') {
      Write-Error 'Shell build-workset must ignore Child issues references when planning dependencies.'
      exit 1
    }
  }
} finally {
  Remove-Item -Path $fixturePath -Force -ErrorAction SilentlyContinue
  if ($originalLedger -ne $null) {
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $ledgerPath), $originalLedger, [System.Text.UTF8Encoding]::new($false))
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
