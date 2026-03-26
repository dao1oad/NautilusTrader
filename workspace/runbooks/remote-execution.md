# Local Execution Runbook

## Purpose

This runbook describes the pure local execution path for `NautilusTrader`.

The local main agent keeps governance and issue ordering in the repository. The same machine runs `codex-orchestrator` jobs inside local worktrees. `agentboard` provides the operator view and full manual override surface on that same machine.

## Local Prerequisites

- `git`
- `tmux`
- `node` / `npm`
- `bun`
- `Codex CLI`
- `codex-orchestrator`
- `agentboard`
- `PowerShell 7`

Recommended local layout on the same machine:

- repo root: `/root/NautilusTrader`
- worktrees: `/root/NautilusTrader/.worktrees`
- dispatch prompts: `/root/NautilusTrader/.dispatch`

## Default Commands

Bootstrap local runtime and observability:

```bash
pwsh -NoProfile -File scripts/ensure-local-runtime.ps1
pwsh -NoProfile -File scripts/start-local-agentboard.ps1
```

Dispatch one issue packet to the local worker:

```bash
pwsh -NoProfile -File scripts/dispatch-issue.ps1 -IssueNumber <issue-number>
```

Synchronize local execution status back into `memory/issue-ledger.md` and `workspace/runbooks/remote-jobs.json`:

```bash
pwsh -NoProfile -File scripts/sync-remote-execution.ps1
```

Prepare local output for local review and PR work:

```bash
pwsh -NoProfile -File scripts/prepare-remote-pr.ps1 -IssueNumber <issue-number>
```

## Agentboard Access

`agentboard` is expected to run on the same machine. Bind it to `127.0.0.1` and open it directly over local HTTP.

Default URL:

```bash
http://127.0.0.1:8088
```

Because the board runs on the same machine, local operator access is full-control: attach, input, create, rename, or kill sessions when recovery is required.

## Failure Recovery

Inspect a stuck local job:

```bash
codex-orchestrator status --run <job-id> --format json
cat <worktree>/.runs/<task-id>/cli/<job-id>/runner.ndjson
```

Remove a failed worktree:

```bash
git -C /root/NautilusTrader worktree remove --force /root/NautilusTrader/.worktrees/issue-<issue-number>
```

After manual cleanup, reset the issue execution state in the repository and re-dispatch.
