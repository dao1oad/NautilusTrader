# Project Governance Framework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reusable repository starter template that includes governance, memory, GitHub issue orchestration, PR/review gates, and bootstrap scripts for future projects.

**Architecture:** The template is split into governance, memory, ops, scripts, GitHub automation, and runtime workspace layers. Human-readable Markdown defines policy, YAML files hold machine-readable settings, PowerShell scripts perform bootstrap and governance checks, and GitHub Actions enforces PR and review gates. The main agent consumes GitHub issues, generates issue packets, dispatches cloud subagents, and writes execution state back into the memory layer.

**Tech Stack:** Markdown, YAML, PowerShell, GitHub Actions, GitHub CLI

---

## Task 1: Scaffold the repository template skeleton

**Files:**

- Create: `D:\aduit_tem\README.md`
- Create: `D:\aduit_tem\PROJECT_INIT.md`
- Create: `D:\aduit_tem\.gitignore`
- Create: `D:\aduit_tem\.editorconfig`
- Create: `D:\aduit_tem\governance\.gitkeep`
- Create: `D:\aduit_tem\memory\.gitkeep`
- Create: `D:\aduit_tem\ops\.gitkeep`
- Create: `D:\aduit_tem\scripts\.gitkeep`
- Create: `D:\aduit_tem\workspace\issue-packets\.gitkeep`
- Create: `D:\aduit_tem\workspace\runbooks\.gitkeep`
- Create: `D:\aduit_tem\workspace\handoffs\.gitkeep`
- Create: `D:\aduit_tem\docs\architecture\.gitkeep`
- Create: `D:\aduit_tem\docs\reports\.gitkeep`
- Test: `D:\aduit_tem\tests\smoke\test-template-layout.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  'README.md',
  'PROJECT_INIT.md',
  '.gitignore',
  '.editorconfig',
  'governance',
  'memory',
  'ops',
  'scripts',
  'workspace',
  'docs\architecture',
  'docs\reports'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing required paths: " + ($missing -join ', '))
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-template-layout.ps1`
Expected: FAIL because the files and folders do not exist yet.

**Step 3: Write minimal implementation**

- Add the root docs and editor files.
- Add empty directory anchors with `.gitkeep`.
- Add a short `README.md` describing the template purpose and a `PROJECT_INIT.md` describing first-run steps.

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-template-layout.ps1`
Expected: PASS with no missing paths reported.

**Step 5: Commit**

```bash
git add README.md PROJECT_INIT.md .gitignore .editorconfig governance memory ops scripts workspace docs tests
git commit -m "feat: scaffold governance template skeleton"
```

## Task 2: Create the root AGENTS contract and governance policy set

**Files:**

- Create: `D:\aduit_tem\AGENTS.md`
- Create: `D:\aduit_tem\governance\charter.md`
- Create: `D:\aduit_tem\governance\operating-model.md`
- Create: `D:\aduit_tem\governance\branch-policy.md`
- Create: `D:\aduit_tem\governance\issue-orchestration.md`
- Create: `D:\aduit_tem\governance\pr-review-policy.md`
- Create: `D:\aduit_tem\governance\definition-of-ready.md`
- Create: `D:\aduit_tem\governance\definition-of-done.md`
- Create: `D:\aduit_tem\governance\risk-escalation.md`
- Create: `D:\aduit_tem\governance\conventions\commit-message.md`
- Create: `D:\aduit_tem\governance\templates\issue-packet-template.md`
- Test: `D:\aduit_tem\tests\smoke\test-governance-files.ps1`

**Step 1: Write the failing test**

```powershell
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
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-governance-files.ps1`
Expected: FAIL because governance files and agent rules are missing.

**Step 3: Write minimal implementation**

- Define the main agent as local `gpt-5.4` with `xhigh`.
- Define the subagent as cloud `gpt-5.4` with `xhigh`.
- State that all non-initialization changes must merge through PR.
- State that remote Codex review is required before merge.
- Add issue packet structure and governance policy documents.

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-governance-files.ps1`
Expected: PASS with all governance files present and AGENTS policy pinned.

**Step 5: Commit**

```bash
git add AGENTS.md governance tests/smoke/test-governance-files.ps1
git commit -m "feat: add governance policies and agent contract"
```

## Task 3: Create the memory system templates

**Files:**

- Create: `D:\aduit_tem\memory\active-context.md`
- Create: `D:\aduit_tem\memory\product-context.md`
- Create: `D:\aduit_tem\memory\repo-map.md`
- Create: `D:\aduit_tem\memory\decision-log.md`
- Create: `D:\aduit_tem\memory\progress-log.md`
- Create: `D:\aduit_tem\memory\issue-ledger.md`
- Create: `D:\aduit_tem\memory\glossary.md`
- Create: `D:\aduit_tem\memory\known-constraints.md`
- Create: `D:\aduit_tem\memory\retrospectives\README.md`
- Test: `D:\aduit_tem\tests\smoke\test-memory-files.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  'memory\active-context.md',
  'memory\product-context.md',
  'memory\repo-map.md',
  'memory\decision-log.md',
  'memory\progress-log.md',
  'memory\issue-ledger.md',
  'memory\glossary.md',
  'memory\known-constraints.md',
  'memory\retrospectives\README.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing memory files: " + ($missing -join ', '))
  exit 1
}

$active = Get-Content 'memory\active-context.md' -Raw
if ($active -notmatch 'Current Goal' -or $active -notmatch 'Next Actions') {
  Write-Error 'active-context.md must include Current Goal and Next Actions sections.'
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-memory-files.ps1`
Expected: FAIL because the memory system has not been created yet.

**Step 3: Write minimal implementation**

- Add the memory files with stable headings and placeholder guidance.
- Make `active-context.md` the required start-of-session file.
- Add a lightweight table format for `issue-ledger.md`.
- Add ADR-style headings in `decision-log.md`.

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-memory-files.ps1`
Expected: PASS with all memory files present and expected headings.

**Step 5: Commit**

```bash
git add memory tests/smoke/test-memory-files.ps1
git commit -m "feat: add reusable project memory system"
```

## Task 4: Add machine-readable policy files

**Files:**

- Create: `D:\aduit_tem\ops\project-policy.yaml`
- Create: `D:\aduit_tem\ops\agent-config.yaml`
- Create: `D:\aduit_tem\ops\issue-board.yaml`
- Create: `D:\aduit_tem\ops\review-gates.yaml`
- Create: `D:\aduit_tem\ops\bootstrap-checklist.md`
- Test: `D:\aduit_tem\tests\smoke\test-ops-config.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  'ops\project-policy.yaml',
  'ops\agent-config.yaml',
  'ops\issue-board.yaml',
  'ops\review-gates.yaml',
  'ops\bootstrap-checklist.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing ops files: " + ($missing -join ', '))
  exit 1
}

$policy = Get-Content 'ops\project-policy.yaml' -Raw
if ($policy -notmatch 'enforce_pull_request_only:\s*true' -or $policy -notmatch 'require_remote_codex_review:\s*true') {
  Write-Error 'project-policy.yaml must enforce PR-only merge and remote Codex review.'
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-ops-config.ps1`
Expected: FAIL because the machine-readable policy files do not exist yet.

**Step 3: Write minimal implementation**

- Pin agent placement and model settings in `agent-config.yaml`.
- Turn on governance enforcement flags in `project-policy.yaml`.
- Add issue orchestration defaults and concurrency groups in `issue-board.yaml`.
- Add merge gate definitions in `review-gates.yaml`.

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-ops-config.ps1`
Expected: PASS with policy flags set to true.

**Step 5: Commit**

```bash
git add ops tests/smoke/test-ops-config.ps1
git commit -m "feat: add machine-readable governance policy files"
```

## Task 5: Implement bootstrap and governance validation scripts

**Files:**

- Create: `D:\aduit_tem\scripts\init-project.ps1`
- Create: `D:\aduit_tem\scripts\check-governance.ps1`
- Test: `D:\aduit_tem\tests\smoke\test-governance-scripts.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  'scripts\init-project.ps1',
  'scripts\check-governance.ps1'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing scripts: " + ($missing -join ', '))
  exit 1
}

$init = Get-Content 'scripts\init-project.ps1' -Raw
$check = Get-Content 'scripts\check-governance.ps1' -Raw

if ($init -notmatch 'gh auth status') {
  Write-Error 'init-project.ps1 must verify GitHub CLI authentication.'
  exit 1
}

if ($check -notmatch 'project-policy.yaml' -or $check -notmatch 'branch protection') {
  Write-Error 'check-governance.ps1 must validate local files and remote branch protection.'
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-governance-scripts.ps1`
Expected: FAIL because the scripts do not exist yet.

**Step 3: Write minimal implementation**

- `init-project.ps1`
  - verify repository information
  - verify `gh auth status`
  - scaffold project-specific values into memory and ops files
  - print the remote hardening checklist
- `check-governance.ps1`
  - verify required files
  - verify critical policy flags
  - detect whether remote `main` protection and required checks are configured

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-governance-scripts.ps1`
Expected: PASS with both scripts containing the required checks.

**Step 5: Commit**

```bash
git add scripts tests/smoke/test-governance-scripts.ps1
git commit -m "feat: add bootstrap and governance validation scripts"
```

## Task 6: Implement issue sync and workset construction

**Files:**

- Create: `D:\aduit_tem\scripts\sync-issues.ps1`
- Create: `D:\aduit_tem\scripts\build-workset.ps1`
- Create: `D:\aduit_tem\workspace\runbooks\issue-packet-schema.md`
- Test: `D:\aduit_tem\tests\smoke\test-issue-workset-scripts.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  'scripts\sync-issues.ps1',
  'scripts\build-workset.ps1',
  'workspace\runbooks\issue-packet-schema.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing issue orchestration files: " + ($missing -join ', '))
  exit 1
}

$sync = Get-Content 'scripts\sync-issues.ps1' -Raw
$workset = Get-Content 'scripts\build-workset.ps1' -Raw

if ($sync -notmatch 'gh issue list') {
  Write-Error 'sync-issues.ps1 must pull issues from GitHub.'
  exit 1
}

if ($workset -notmatch 'issue-ledger' -or $workset -notmatch 'issue-packets') {
  Write-Error 'build-workset.ps1 must build the issue ledger and packet outputs.'
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-issue-workset-scripts.ps1`
Expected: FAIL because issue sync and workset logic is missing.

**Step 3: Write minimal implementation**

- `sync-issues.ps1`
  - call `gh issue list`
  - normalize labels, assignees, milestones, and links
  - write a local snapshot for later planning
- `build-workset.ps1`
  - classify issues into blocked, ready, parallel-ready, and needs-clarification
  - render `memory\issue-ledger.md`
  - generate `workspace\issue-packets\*.md`

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-issue-workset-scripts.ps1`
Expected: PASS with both scripts and the packet schema present.

**Step 5: Commit**

```bash
git add scripts workspace tests/smoke/test-issue-workset-scripts.ps1 memory/issue-ledger.md
git commit -m "feat: add issue synchronization and workset generation"
```

## Task 7: Implement PR preflight and merge close-loop scripts

**Files:**

- Create: `D:\aduit_tem\scripts\pre-pr-check.ps1`
- Create: `D:\aduit_tem\scripts\close-loop.ps1`
- Create: `D:\aduit_tem\workspace\handoffs\review-resolution-template.md`
- Test: `D:\aduit_tem\tests\smoke\test-pr-close-loop-scripts.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  'scripts\pre-pr-check.ps1',
  'scripts\close-loop.ps1',
  'workspace\handoffs\review-resolution-template.md'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing PR scripts: " + ($missing -join ', '))
  exit 1
}

$pre = Get-Content 'scripts\pre-pr-check.ps1' -Raw
$close = Get-Content 'scripts\close-loop.ps1' -Raw

if ($pre -notmatch 'memory' -or $pre -notmatch 'remote Codex review') {
  Write-Error 'pre-pr-check.ps1 must validate memory updates and remote review prerequisites.'
  exit 1
}

if ($close -notmatch 'progress-log' -or $close -notmatch 'active-context') {
  Write-Error 'close-loop.ps1 must update memory after merge.'
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-pr-close-loop-scripts.ps1`
Expected: FAIL because the PR and merge close-loop scripts are missing.

**Step 3: Write minimal implementation**

- `pre-pr-check.ps1`
  - validate linked issue information
  - validate required memory updates
  - validate review gate prerequisites
- `close-loop.ps1`
  - update `progress-log.md`
  - update `active-context.md`
  - update `issue-ledger.md`
- add a template file for review comment resolution evidence

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-pr-close-loop-scripts.ps1`
Expected: PASS with both scripts and the resolution template present.

**Step 5: Commit**

```bash
git add scripts workspace tests/smoke/test-pr-close-loop-scripts.ps1 memory
git commit -m "feat: add pr preflight and merge close-loop automation"
```

## Task 8: Add GitHub templates and workflow gates

**Files:**

- Create: `D:\aduit_tem\.github\PULL_REQUEST_TEMPLATE.md`
- Create: `D:\aduit_tem\.github\ISSUE_TEMPLATE\feature.yml`
- Create: `D:\aduit_tem\.github\ISSUE_TEMPLATE\bug.yml`
- Create: `D:\aduit_tem\.github\workflows\governance-check.yml`
- Create: `D:\aduit_tem\.github\workflows\pr-gate.yml`
- Test: `D:\aduit_tem\tests\smoke\test-github-templates.ps1`

**Step 1: Write the failing test**

```powershell
$required = @(
  '.github\PULL_REQUEST_TEMPLATE.md',
  '.github\ISSUE_TEMPLATE\feature.yml',
  '.github\ISSUE_TEMPLATE\bug.yml',
  '.github\workflows\governance-check.yml',
  '.github\workflows\pr-gate.yml'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Error ("Missing GitHub templates: " + ($missing -join ', '))
  exit 1
}

$pr = Get-Content '.github\PULL_REQUEST_TEMPLATE.md' -Raw
if ($pr -notmatch 'remote Codex review' -or $pr -notmatch 'memory') {
  Write-Error 'The PR template must require remote Codex review and memory update disclosure.'
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-github-templates.ps1`
Expected: FAIL because the GitHub templates and workflows are missing.

**Step 3: Write minimal implementation**

- Add issue forms that capture scope, dependencies, risk, and acceptance criteria.
- Add a PR template that requires issue link, testing, memory changes, and review closure notes.
- Add workflow files:
  - `governance-check.yml` for repository policy integrity
  - `pr-gate.yml` for PR gate enforcement

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-github-templates.ps1`
Expected: PASS with all templates and workflows present.

**Step 5: Commit**

```bash
git add .github tests/smoke/test-github-templates.ps1
git commit -m "feat: add github templates and governance gates"
```

## Task 9: Add an end-to-end smoke check for the template

**Files:**

- Create: `D:\aduit_tem\tests\smoke\run-all.ps1`
- Modify: `D:\aduit_tem\README.md`
- Modify: `D:\aduit_tem\PROJECT_INIT.md`
- Test: `D:\aduit_tem\tests\smoke\run-all.ps1`

**Step 1: Write the failing test**

```powershell
$smokes = @(
  'tests\smoke\test-template-layout.ps1',
  'tests\smoke\test-governance-files.ps1',
  'tests\smoke\test-memory-files.ps1',
  'tests\smoke\test-ops-config.ps1',
  'tests\smoke\test-governance-scripts.ps1',
  'tests\smoke\test-issue-workset-scripts.ps1',
  'tests\smoke\test-pr-close-loop-scripts.ps1',
  'tests\smoke\test-github-templates.ps1'
)

$failed = @()
foreach ($test in $smokes) {
  powershell -ExecutionPolicy Bypass -File $test
  if ($LASTEXITCODE -ne 0) {
    $failed += $test
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Smoke suite failed: " + ($failed -join ', '))
  exit 1
}
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\run-all.ps1`
Expected: FAIL until every earlier smoke test is present and passing.

**Step 3: Write minimal implementation**

- Add the smoke suite runner.
- Update `README.md` with the canonical startup flow.
- Update `PROJECT_INIT.md` with the exact bootstrap sequence and remote hardening checklist.

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\run-all.ps1`
Expected: PASS with all smoke checks green.

**Step 5: Commit**

```bash
git add README.md PROJECT_INIT.md tests/smoke
git commit -m "feat: add end-to-end smoke verification for governance template"
```

## Task 10: Verify repository readiness and document handoff

**Files:**

- Modify: `D:\aduit_tem\README.md`
- Modify: `D:\aduit_tem\PROJECT_INIT.md`
- Modify: `D:\aduit_tem\docs\plans\2026-03-23-project-governance-design.md`
- Modify: `D:\aduit_tem\docs\plans\2026-03-23-project-governance-framework.md`
- Create: `D:\aduit_tem\tests\smoke\test-template-docs.ps1`

**Step 1: Write the failing test**

```powershell
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
```

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-template-docs.ps1`
Expected: FAIL until the setup docs document the enforced workflow clearly.

**Step 3: Write minimal implementation**

- Align the top-level docs with the actual scripts and policy files.
- Add a handoff section describing how the template should be copied into the next project.

**Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests\smoke\test-template-docs.ps1`
Expected: PASS with the enforced workflow fully documented.

**Step 5: Commit**

```bash
git add README.md PROJECT_INIT.md docs/plans tests/smoke/test-template-docs.ps1
git commit -m "docs: finalize template handoff and readiness guidance"
```
