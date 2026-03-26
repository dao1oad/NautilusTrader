# 运行模型

- 主 agent 在本地负责调度。
- bounded issue 执行通过同机 `codex-orchestrator` 在本地 worktree 内完成。
- `agentboard` 在本机提供运行观测、会话接管与手动干预能力。
- review 采用本地 pre-PR review 记录，在开 PR 前收敛证据并完成闭环。
