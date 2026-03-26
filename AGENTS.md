<!-- codex:instruction-stamp 07bf18366fb0ff50dd9ff9ec77aa2378853994c8e8b5a7c304ae0edd617b49d8 -->
# AGENTS

## Default Models

- Main agent: local execution, `gpt-5.4`, reasoning `xhigh`
- Subagent runtime: local `codex-orchestrator` on the same machine, `gpt-5.4`, reasoning `xhigh`
- Review: local pre-PR review before opening pull requests

## Startup Read Order

The main agent must read these files before orchestration:

1. `memory/active-context.md`
2. `memory/product-context.md`
3. `docs/system-truth/index.md`
4. `memory/repo-map.md`
5. `memory/issue-ledger.md`
6. `ops/project-policy.yaml`
7. `ops/agent-config.yaml`
8. `ops/remote-execution.yaml`
9. `ops/doc-truth-registry.yaml`
10. `ops/doc-truth-map.yaml`

## Default Startup Behavior

- When the user starts Codex in the repository root and gives a generic continuation request such as `continue`, `继续`, `start`, or `启动主agent`, treat that as permission to bootstrap the main agent loop.
- In that case, read the Startup Read Order, then run `pwsh -NoProfile -File scripts/check-governance.ps1` followed by `pwsh -NoProfile -File scripts/start-main-agent.ps1 -AutoDispatch`.
- If the ledger shows a ready issue whose previous local run failed, treat the same generic continuation request as permission to retry that failed local issue run through the recovery path.
- If the ledger already shows a running local issue, keep the generic continuation request non-failing: report the active run and stay in observation mode instead of starting a duplicate dispatch.
- If the user explicitly wants inspection without dispatch, run `pwsh -NoProfile -File scripts/start-main-agent.ps1` instead.
- After startup, report the issue ledger summary, any recoverable failed issues, the selected issue, the dispatch or retry result, and the local `agentboard` URL.

## Execution Rules

- Except for project initialization, changes must reach remote `main` only via pull request.
- The main agent pulls GitHub issues, orders dependencies, and dispatches bounded tasks through the configured local execution worker on the same machine.
- `scripts/start-main-agent.ps1` must bootstrap `scripts/ensure-local-runtime.ps1` and `scripts/start-local-agentboard.ps1` before dispatch.
- Parallel work is allowed only for issues without dependency or write-set conflicts.
- Execution state must be recorded in `workspace/runbooks/remote-jobs.json` and mirrored into `memory/issue-ledger.md`.
- Each pull request must have a completed local pre-PR review record before it is opened.
- Review comments must be resolved, accepted, or dismissed with a reason before merge.
- Most production code changes must update the mapped source-of-truth documents before pull request merge.
