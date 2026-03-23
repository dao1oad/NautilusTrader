# Architecture Truth

## System

当前仓库由治理层、静态真值层、运行态记忆层、机器策略层、执行脚本层和 GitHub gate 层组成。

## Current Repository Shape

- 当前仓库是从治理启动模板复制出的新项目目录。
- 当前没有业务实现层代码，生产执行面集中在 `scripts/`、`.github/`、`ops/` 与 `AGENTS.md`。
- 当前系统首先保证“治理控制面可执行”，再等待业务代码接入。

## Invariants

- 主 agent 在本地编排
- subagent 在云端执行
- 默认开启 truth-doc 门禁
- `main` 只通过 PR 合并，初始化阶段除外
- merge 前必须完成远端 Codex review 与本地 review 闭环记录
- 当前仓库允许单维护者模式：GitHub approving review 计数可配置为 `0`，但不能替代远端 Codex review
- 新增任何生产代码路径前，必须先建立 truth role 绑定
- GitHub 中的远端 Codex review 由提交到 PR 的 Codex connector review 事件体现，而不是仓库协作者手工代替
