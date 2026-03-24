# NautilusTrader Bootstrap Initialization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebind the copied governance template to the current `NautilusTrader` repository so it is immediately executable, governable, and memory-backed.

**Architecture:** The repository currently contains only the governance template skeleton, so the first binding targets governance assets themselves: `scripts/`, `.github/`, `ops/`, and the system-truth set. Memory files describe current bootstrap state, while truth documents define the enforced repository operating model and machine interfaces. Remote GitHub hardening is verified separately and remains blocked until a same-name repository exists with explicit visibility.

**Tech Stack:** Markdown, YAML, PowerShell, Git, GitHub CLI, GitHub Actions

---

## Task 1: Inspect current repository reality

**Files:**

- Read: `D:\NautilusTrader\AGENTS.md`
- Read: `D:\NautilusTrader\README.md`
- Read: `D:\NautilusTrader\PROJECT_INIT.md`
- Read: `D:\NautilusTrader\ops\project-policy.yaml`
- Read: `D:\NautilusTrader\ops\doc-truth-registry.yaml`
- Read: `D:\NautilusTrader\ops\doc-truth-map.yaml`
- Read: `D:\NautilusTrader\memory\active-context.md`
- Read: `D:\NautilusTrader\docs\system-truth\index.md`

**Step 1:** Confirm git status, current branch, remotes, and GitHub auth state.

**Step 2:** Enumerate actual repository directories to detect whether production code paths exist.

**Step 3:** Read bootstrap scripts and review-gate config to understand local and remote governance expectations.

## Task 2: Rebind local memory and truth documents

**Files:**

- Modify: `D:\NautilusTrader\memory\product-context.md`
- Modify: `D:\NautilusTrader\memory\repo-map.md`
- Modify: `D:\NautilusTrader\memory\active-context.md`
- Modify: `D:\NautilusTrader\docs\system-truth\index.md`
- Modify: `D:\NautilusTrader\docs\system-truth\architecture.md`
- Modify: `D:\NautilusTrader\docs\system-truth\module-boundaries.md`
- Modify: `D:\NautilusTrader\docs\system-truth\api-contracts.md`
- Modify: `D:\NautilusTrader\docs\system-truth\data-model.md`
- Modify: `D:\NautilusTrader\docs\system-truth\runtime-flows.md`
- Modify: `D:\NautilusTrader\docs\system-truth\integrations.md`

**Step 1:** Replace template-centric wording with repository-specific bootstrap state for `NautilusTrader`.

**Step 2:** Document that `memory/` is runtime memory only and system-truth remains under `docs/system-truth/`.

**Step 3:** Capture the current absence of business code and define the current truth surface around governance assets and automation flows.

## Task 3: Rebind truth registry and truth map to real paths

**Files:**

- Modify: `D:\NautilusTrader\ops\doc-truth-registry.yaml`
- Modify: `D:\NautilusTrader\ops\doc-truth-map.yaml`

**Step 1:** Keep truth roles enabled by default.

**Step 2:** Point each role to the actual `docs/system-truth/*.md` files that describe the current repository.

**Step 3:** Map real executable/production paths only: `scripts/**`, `.github/**`, `ops/**`, and `AGENTS.md`.

**Step 4:** Leave `tests/**`, `docs/**`, `memory/**`, and `governance/**` exempt, and avoid inventing missing `src/`-style layouts.

## Task 4: Validate initialization locally

**Files:**

- Run: `D:\NautilusTrader\scripts\init-project.ps1`
- Run: `D:\NautilusTrader\scripts\check-governance.ps1`

**Step 1:** Run `scripts/init-project.ps1 -ProjectName NautilusTrader`.

**Step 2:** Run `scripts/check-governance.ps1 -SkipRemoteChecks` to verify local governance integrity.

**Step 3:** Optionally run smoke checks if they can provide additional confidence without conflicting with bootstrap state.

## Task 5: Prepare remote bootstrap and report blockers

**Files:**

- Inspect: git config and `gh` repository availability

**Step 1:** Check whether `dao1oad/NautilusTrader` already exists.

**Step 2:** If remote creation is blocked by unresolved visibility or unavailable policy integration, record the minimal confirmation list instead of guessing.

**Step 3:** Report remote governance status separately from local governance status.
