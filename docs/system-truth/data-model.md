# Data Model Truth

## Product Domain Data

- `crates/model` 与 `nautilus_trader/model`
  - 数据职责：统一金融领域模型，包括 instrument、identifier、price、quantity、order、order book、trade、bar、position、status、funding rate 等核心实体
- `crates/data` 与 `nautilus_trader/data`
  - 数据职责：市场数据、聚合数据、历史数据与自定义数据的读取、转换与发布
- `crates/execution`、`crates/portfolio`、`crates/risk`
  - 数据职责：订单执行状态、成交回报、组合估值、保证金、风控与仓位约束
- `crates/persistence`、`nautilus_trader/persistence`、`schema/sql`
  - 数据职责：目录、数据库、Arrow/Parquet 与 SQL 持久化对象
- `tests/test_data/**`
  - 数据职责：测试夹具与样本数据，不是产品真值来源

## Governance Data

- `ops/doc-truth-registry.yaml`: 定义 `truth role -> 文档路径`
- `ops/doc-truth-map.yaml`: 定义 `代码路径 -> truth role`
- `memory/issue-ledger.md`: issue 编排账本
- `workspace/runbooks/issues-snapshot.json`: GitHub open issues 标准化快照
- `workspace/issue-packets/*.md`: subagent 任务包
- `workspace/handoffs/review-resolution-*.md`: review 闭环凭据
- `ops/*.yaml`: 治理策略、agent 配置、review gate 与编排设置

## Data Model Rules

- `schema/sql` 中的表、类型、函数与分区定义，必须与 persistence 层的数据读写约束一致
- 新增领域实体时，应明确落点在 `model`、`data`、`execution`、`portfolio`、`risk` 或 `persistence` 中的哪一层
- 测试数据可证明行为，但不能替代领域模型真值文档
