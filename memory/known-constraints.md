# Known Constraints

- 远端 `main` 强制保护依赖 GitHub 仓库设置。
- 本机 `codex-orchestrator`、`agentboard`、`tmux`、`node/npm` 与 `codex` CLI 必须在当前机器可用。
- 模板内部文件只能定义规则、检查偏差并阻断本地流程。
