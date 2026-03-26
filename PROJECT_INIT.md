# NautilusTrader Project Init

## Required Sequence

1. 确认 GitHub 仓库可见性并创建 `NautilusTrader` 同名仓库。
2. 绑定 GitHub 仓库与 `origin`。
3. 运行 `scripts/init-project.ps1`，或在 Linux/macOS 上运行 `scripts/init-project.sh`。
4. 配置远端 `main only via pull request`。
5. 配置 required checks：`governance-check`、`pr-gate`。
6. 配置 `local pre-PR review`、conversation resolution 与 review 闭环要求。
7. 绑定 `ops/doc-truth-registry.yaml`、`ops/doc-truth-map.yaml` 与 `ops/remote-execution.yaml` 到本项目实际结构。
8. 运行 `scripts/check-governance.ps1`，或在 Linux/macOS 上运行 `scripts/check-governance.sh`。

## What Must Exist Before Execution

- `AGENTS.md`
- `ops/project-policy.yaml`
- `ops/doc-truth-registry.yaml`
- `ops/doc-truth-map.yaml`
- `memory/active-context.md`
- `memory/issue-ledger.md`
- `docs/system-truth/index.md`

## Current Bootstrap Status

- 本地文档与 truth-doc 已按当前结构重绑
- 纯本机治理链路已对齐：主 agent、本机 `codex-orchestrator`、本机 `agentboard`、本地 pre-PR review
- `ops/remote-execution.yaml` 已绑定当前仓库路径
- Linux/macOS 的 shell 治理入口与 Windows PowerShell 入口都需保持同一治理语义

## First Operational Loop

1. 用 `scripts/sync-issues.ps1` 或 `scripts/sync-issues.sh` 拉取 GitHub issues。
2. 用 `scripts/build-workset.ps1` 或 `scripts/build-workset.sh` 更新 `issue-ledger` 和 issue packets。
3. 用 `scripts/ensure-local-runtime.ps1` 与 `scripts/start-local-agentboard.ps1` 启动本机执行链。
4. 由主 agent 编排顺序与并发，并通过 `scripts/start-main-agent.ps1` 进入主循环。
4. 所有非初始化变更走 PR。
5. 对大多数生产代码改动，同步对应 system-truth 文档。
6. 开 PR 前必须完成 `local pre-PR review` 并落盘 review record。

## Recommended Prompt

推荐直接使用 [main-agent-startup-prompt.md](prompts/main-agent-startup-prompt.md) 启动当前仓库主 agent。

它会要求 agent：
- 读取治理、记忆与 truth-doc 配置
- 启动本机 `codex-orchestrator` 与 `agentboard`
- 同步 issue ledger 与本机执行状态
- 自动选择并派发首个可执行 issue
- 输出当前观测地址与下一步命令
