# AGENTS

## Default Models

- Main agent: local execution, `gpt-5.4`, reasoning `xhigh`
- Subagent: Codex cloud execution, `gpt-5.4`, reasoning `xhigh`
- Review: remote Codex review before merge

## Startup Read Order

The main agent must read these files before orchestration:

1. `memory/active-context.md`
2. `memory/product-context.md`
3. `docs/system-truth/index.md`
4. `memory/repo-map.md`
5. `memory/issue-ledger.md`
6. `ops/project-policy.yaml`
7. `ops/agent-config.yaml`
8. `ops/doc-truth-registry.yaml`
9. `ops/doc-truth-map.yaml`

## Execution Rules

- Except for project initialization, changes must reach remote `main` only via pull request.
- The main agent pulls GitHub issues, orders dependencies, and dispatches bounded tasks to cloud subagents.
- Parallel work is allowed only for issues without dependency or write-set conflicts.
- Each pull request must complete remote Codex review before merge.
- Review comments must be resolved, accepted, or dismissed with a reason before merge.
- Most production code changes must update the mapped source-of-truth documents before pull request merge.
