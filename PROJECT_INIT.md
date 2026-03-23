# NautilusTrader Project Init

## Required Sequence

1. 确认 GitHub 仓库可见性并创建 `NautilusTrader` 同名仓库。
2. 绑定 GitHub 仓库与 `origin`。
3. 运行 `scripts/init-project.ps1`。
4. 配置远端 `main only via pull request`。
5. 配置 required checks：`governance-check`、`pr-gate`。
6. 配置 `remote Codex review` 为 merge 前门槛。
7. 绑定 `ops/doc-truth-registry.yaml` 与 `ops/doc-truth-map.yaml` 到本项目实际文档和代码结构。
8. 运行 `scripts/check-governance.ps1`。

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
- 本地治理检查已通过
- smoke suite 已通过
- 远端仓库与 branch protection 仍待完成

## First Operational Loop

1. 用 `scripts/sync-issues.ps1` 拉取 GitHub issues。
2. 用 `scripts/build-workset.ps1` 更新 `issue-ledger` 和 issue packets。
3. 由主 agent 编排顺序与并发。
4. 所有非初始化变更走 PR。
5. 对大多数生产代码改动，同步对应 system-truth 文档。
6. merge 前必须完成 `remote Codex review`。

## Recommended Prompt

推荐直接使用 [project-bootstrap-prompt.md](D:\NautilusTrader\prompts\project-bootstrap-prompt.md)。

它会要求 agent：
- 读取治理与真值配置
- 识别当前项目结构
- 自动初始化 memory 与 system-truth
- 绑定 `doc-truth-registry.yaml` 与 `doc-truth-map.yaml`
- 运行 `scripts/init-project.ps1` 与 `scripts/check-governance.ps1`
- 只把高风险不确定项留在最小待确认清单里
