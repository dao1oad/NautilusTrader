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

## Admin Control Plane Data

- `nautilus_trader/admin/schemas.py`
  - 数据职责：为浏览器提供 `Phase 1` 管理控制面 DTO，而不是暴露内部 `live`、`execution`、`portfolio`、`risk`、`persistence` domain object
- `OverviewSnapshot`
  - 数据职责：单次概览快照根对象；包含 `generated_at`、`stale`、`partial`、`node`、`strategies`、`adapters`、`accounts`、`positions`、`errors`
- `NodesSnapshot`
  - 数据职责：`Nodes` 只读列表快照；包含 `generated_at`、`partial`、`items`、`errors`
- `StrategiesSnapshot`
  - 数据职责：`Strategies` 只读列表快照；包含 `generated_at`、`partial`、`items`、`errors`
- `AdaptersSnapshot`
  - 数据职责：`Adapters` 只读列表快照；包含 `generated_at`、`partial`、`items`、`errors`
- `OrdersSnapshot`
  - 数据职责：`Orders` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `PositionsSnapshot`
  - 数据职责：`Positions` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `AccountsSnapshot`
  - 数据职责：`Accounts` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `LogsSnapshot`
  - 数据职责：`Logs` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `NodeSummary`
  - 数据职责：node 级摘要；在 `Phase 0` 至少表达 node 状态与可选 `node_id`
- `StrategySummary`
  - 数据职责：策略摘要；表达浏览器可见的 strategy 标识与状态
- `AdapterSummary`
  - 数据职责：适配器摘要；表达浏览器可见的 adapter 标识与状态
- `OrderSummary`
  - 数据职责：订单摘要；表达浏览器可见的 `client_order_id`、`instrument_id`、`side`、`quantity` 与 `status`
- `AccountSummary`
  - 数据职责：账户摘要；表达浏览器可见的 account 标识与状态
- `PositionSummary`
  - 数据职责：持仓摘要；表达浏览器可见的 instrument、方向与数量
- `LogSummary`
  - 数据职责：日志摘要；表达浏览器可见的 `timestamp`、`level`、`component` 与 `message`
- `SectionError`
  - 数据职责：局部失败投影；用于把后端子区域失败以 `section + message` 的形式暴露给浏览器，而不是泄露内部异常对象

当前浏览器可见的数据模型就是上述 admin DTO；任何内部运行时对象都必须先投影到这些 DTO，再通过 `nautilus_trader/admin` 暴露。

- `apps/admin-web/src/shared/ui/page-state.tsx`
  - 数据职责：统一浏览器侧 page-state view model；当前固定状态集合为 `loading`、`empty`、`error`、`stale`
- `apps/admin-web/src/shared/realtime/invalidation-bus.ts`
  - 数据职责：浏览器侧 invalidation topic 投影；当前定义 `overview`、`nodes`、`strategies`、`adapters`、`orders`、`positions`、`accounts`、`logs` 八个 topic，并把最小 WS 事件集合映射到对应 query invalidation
- `apps/admin-web/src/shared/query/query-client.ts`
  - 数据职责：浏览器侧 query key 与缓存入口；当前固定 `overview`、`nodes`、`strategies`、`adapters` 四组 `["admin", <resource>]` query key，并为 `orders`、`positions`、`accounts`、`logs` 定义带 `limit` 维度的 `["admin", <resource>, <limit>]` query key

## Governance Data

- `ops/doc-truth-registry.yaml`: 定义 `truth role -> 文档路径`
- `ops/doc-truth-map.yaml`: 定义 `代码路径 -> truth role`
- `memory/issue-ledger.md`: issue 编排账本
- `workspace/runbooks/issues-snapshot.json`: GitHub open issues 标准化快照
- `workspace/issue-packets/*.md`: subagent 任务包
- `workspace/handoffs/review-resolution-issue-*.md`: issue 级本地 pre-PR review 凭据；当前由 `scripts/prepare-remote-pr.ps1` 生成并由 `scripts/pre-pr-check.ps1` 校验
- `workspace/handoffs/local-review-issue-*.md`: 早期本地 review 迁移阶段遗留的历史凭据，保留用于已合并 PR 的审计追溯，不再作为当前 gate 的 canonical 输入
- `workspace/handoffs/review-resolution-*.md`: 历史远端 review 或旧 PR 级闭环记录
- `ops/*.yaml`: 治理策略、agent 配置、review gate 与编排设置

## Data Model Rules

- `schema/sql` 中的表、类型、函数与分区定义，必须与 persistence 层的数据读写约束一致
- 新增领域实体时，应明确落点在 `model`、`data`、`execution`、`portfolio`、`risk` 或 `persistence` 中的哪一层
- 新增 browser-facing 管理数据模型时，应优先落在 `nautilus_trader/admin` DTO 层，并明确它与内部 domain object 的投影关系
- 测试数据可证明行为，但不能替代领域模型真值文档
