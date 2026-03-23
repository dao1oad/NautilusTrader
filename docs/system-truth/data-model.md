# Data Model Truth

## Governance Data

- `ops/doc-truth-registry.yaml`
  - 数据职责：定义 `truth role -> 文档路径`
- `ops/doc-truth-map.yaml`
  - 数据职责：定义 `代码路径 -> truth role`
- `memory/issue-ledger.md`
  - 数据职责：issue 编排账本
- `workspace/runbooks/issues-snapshot.json`
  - 数据职责：GitHub open issues 标准化快照
- `workspace/issue-packets/*.md`
  - 数据职责：subagent 任务包
- `workspace/handoffs/review-resolution-*.md`
  - 数据职责：review 闭环凭据
- `ops/*.yaml`
  - 数据职责：治理策略、agent 配置、review gate、所需 approving review 计数和编排设置

## Current Product Data Status

- 当前仓库尚无业务域数据模型
- 后续若引入业务实体或持久化结构，必须新增或扩展对应 truth 文档
