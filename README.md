# NautilusTrader Governance Bootstrap

当前仓库已完成治理框架、记忆系统、truth-doc 绑定和本地 smoke 校验，可作为 `NautilusTrader` 项目的启动基线继续接入业务代码。

## What This Repository Enforces

- `main only via pull request`
- `remote Codex review` before merge
- GitHub issue driven orchestration by a local main agent
- cloud subagent execution for bounded issue packets
- memory updates through `active-context`, `progress-log`, and `issue-ledger`
- system truth updates through `docs/system-truth/` and `ops/doc-truth-map.yaml`

## Current State

- 已绑定 `memory/`、`docs/system-truth/`、`ops/doc-truth-registry.yaml`、`ops/doc-truth-map.yaml`
- 已通过 `scripts/init-project.ps1`
- 已通过 `scripts/check-governance.ps1 -SkipRemoteChecks`
- 已通过 `tests/smoke/run-all.ps1`
- 当前尚未绑定 GitHub `origin`
- 当前尚未接入业务代码目录，如 `src/`、`app/`、`lib/`、`services/`

## Main Components

- `AGENTS.md`: 主 agent、本地/云端执行模型和调度规则
- `governance/`: 制度与门槛
- `memory/`: 项目长期记忆，尤其是 `issue-ledger`
- `docs/system-truth/`: 系统静态真值
- `ops/`: 机器可读策略
- `prompts/project-bootstrap-prompt.md`: 复制模板后直接粘贴给 agent 的启动 prompt
- `scripts/init-project.ps1`: 新项目初始化入口
- `scripts/check-governance.ps1`: 本地与远端治理检查入口
- `.github/`: PR 模板、Issue 模板和 workflow gate

## Startup Flow

1. 创建并绑定 GitHub 同名仓库。
2. 配置远端 `main only via pull request`。
3. 配置 required checks：`governance-check`、`pr-gate`。
4. 配置 `remote Codex review` 为 merge 前门槛。
5. 运行 `scripts/check-governance.ps1` 完成远端校验。
6. 同步 GitHub issues，生成 `issue-ledger` 与 issue packets。
7. 由主 agent 按依赖和并发规则分发任务。
8. 对大多数生产代码变更，同步对应的 `docs/system-truth/` 真值文档后再发起 PR。

## Issue Orchestration Entry

- 本地入口：`scripts/sync-issues.ps1`
- 工作集构建：`scripts/build-workset.ps1`
- 当前状态：脚本与 smoke 可用，但在 GitHub 仓库绑定前无法完成真实 issue 拉取

## Bootstrap Prompt

当前目录已完成首轮绑定；后续新目录仍可参考 `prompts/project-bootstrap-prompt.md` 执行相同步骤。
