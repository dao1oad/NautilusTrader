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
- `FillsSnapshot`
  - 数据职责：`Fills` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `PositionsSnapshot`
  - 数据职责：`Positions` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `AccountsSnapshot`
  - 数据职责：`Accounts` 只读列表快照；包含 `generated_at`、`limit`、跨账户 `summary`、`partial`、`items`、`errors`
- `RiskSnapshot`
  - 数据职责：`Risk center` 根对象；包含 `generated_at`、`summary`、`partial`、`events`、`blocks`、`errors`
- `AccountsSummary`
  - 数据职责：跨账户资金与保证金摘要；表达 `active_accounts`、`total_equity`、`available_cash`、`margin_used`、`margin_available`、`gross_exposure`、`net_exposure`
- `AccountBalanceSummary`
  - 数据职责：账户 drill-down 中的资产余额投影；表达 asset、total、available、locked
- `AccountExposureSummary`
  - 数据职责：账户 drill-down 中的 instrument exposure 投影；表达 instrument、方向、净数量、名义敞口与 leverage
- `LogsSnapshot`
  - 数据职责：`Logs` 只读列表快照；包含 `generated_at`、`limit`、`partial`、`items`、`errors`
- `CatalogSnapshot`
  - 数据职责：`Catalog` 只读列表快照；包含 `generated_at`、`limit`、bounded `history_query`、`partial`、`items`、`operator_notes`、`errors`
- `PlaybackSnapshot`
  - 数据职责：`Playback` 预览根对象；包含 `generated_at`、bounded `request`、`partial`、`timeline`、`events`、`operator_notes`、`errors`
- `DiagnosticsSnapshot`
  - 数据职责：`Diagnostics` 根对象；包含 `generated_at`、`summary`、`partial`、`links`、`query_timings`、`errors`
- `NodeSummary`
  - 数据职责：node 级摘要；在 `Phase 0` 至少表达 node 状态与可选 `node_id`
- `StrategySummary`
  - 数据职责：策略摘要；表达浏览器可见的 strategy 标识与状态
- `AdapterSummary`
  - 数据职责：适配器摘要；表达浏览器可见的 adapter 标识与状态
- `OrderSummary`
  - 数据职责：订单摘要；表达浏览器可见的 `client_order_id`、`instrument_id`、`side`、`quantity` 与 `status`
- `FillSummary`
  - 数据职责：成交摘要；表达浏览器可见的 `fill_id`、关联 `client_order_id`、`instrument_id`、方向、数量、价格、流动性侧与时间戳
- `AccountSummary`
  - 数据职责：账户摘要；表达浏览器可见的 account 标识、状态，以及 account drill-down 所需的 venue / account_type / base_currency、余额、保证金、敞口与 alerts
- `RiskSummary`
  - 数据职责：风险总览摘要；表达 trading_state、risk_level、margin / exposure utilization、active_alerts 与 blocked_actions
- `RiskEvent`
  - 数据职责：风险事件时间线项；表达稳定 event_id、severity、标题、消息与发生时间
- `RiskBlock`
  - 数据职责：当前风险阻断投影；表达 block_id、scope、reason、status 与 raised_at
- `PositionSummary`
  - 数据职责：持仓摘要；表达浏览器可见的 position 标识、instrument、方向、数量，以及 position drill-down 所需的开仓价、已实现/未实现盈亏与时间戳
- `LogSummary`
  - 数据职责：日志摘要；表达浏览器可见的 `timestamp`、`level`、`component` 与 `message`
- `CatalogEntry`
  - 数据职责：catalog browse item；表达 catalog 标识、instrument、data type、timeframe、status、row count 与可读取时间窗口
- `HistoryQuery`
  - 数据职责：bounded history query 投影；表达 catalog/instrument、UTC window、limit、returned_rows 与 operator-visible feedback
- `PlaybackRequest`
  - 数据职责：bounded playback request 投影；表达 request 标识、catalog/instrument、UTC window、limit、speed、event type 与 operator-visible feedback
- `PlaybackTimelinePoint`
  - 数据职责：playback 图表点；表达时间戳、mid-price 与累计事件数
- `PlaybackEventSummary`
  - 数据职责：playback 事件预览项；表达事件时间、事件类型与简要说明
- `DiagnosticsSummary`
  - 数据职责：跨 catalog/playback 的健康摘要；表达 overall_status、healthy/degraded link 数、slow query 数与最新 catalog sync 时间
- `LinkHealth`
  - 数据职责：链路健康投影；表达 link 标识、标签、状态、延迟、最近检查时间与人类可读 detail
- `QueryTiming`
  - 数据职责：查询耗时投影；表达 query 标识、surface、status、limit、窗口范围、返回行数、耗时与 detail
- `SectionError`
  - 数据职责：局部失败投影；用于把后端子区域失败以 `section + message` 的形式暴露给浏览器，而不是泄露内部异常对象
- `CommandRequest`
  - 数据职责：管理命令请求 DTO；表达控制意图、目标资源、结构化 payload、发起者与请求时间戳
- `CommandReceipt`
  - 数据职责：命令处理结果 DTO；统一承载 `accepted/completed/failed` 状态、时间戳、可选消息与失败体
- `CommandFailure`
  - 数据职责：命令失败投影；把稳定错误码、重试提示和细节数据暴露给浏览器/运维，而不是泄露 Python 异常对象
- `CommandErrorCode`
  - 数据职责：Phase 2 管理命令的稳定错误码枚举，供 HTTP/WS 回执与审计流复用
- `AuditRecord`
  - 数据职责：append-only 管理命令审计事件；以 `sequence_id` 表达时间序列顺序，并保留原始 payload 与失败上下文
- `AuditSnapshot`
  - 数据职责：浏览器审计时间线根对象；包含 `generated_at`、`partial`、`items`、`errors`，其中 `items` 以最近 command 事件优先排序
- `ConfigDiffEntry`
  - 数据职责：本机 control-plane guardrail 对比项；表达配置键、摘要、期望值、当前值、状态与可选恢复 runbook 绑定
- `RecoveryRunbook`
  - 数据职责：浏览器恢复说明；表达 runbook 标识、标题、摘要与具体步骤
- `ConfigDiffSnapshot`
  - 数据职责：浏览器配置 diff / 恢复根对象；把 `ConfigDiffEntry[]` 与 `RecoveryRunbook[]` 打包为单次只读快照
- `command.*` WS event envelope
  - 数据职责：把 `CommandReceipt` 包装成浏览器可消费的实时事件；当前 envelope 结构为 `{type, receipt}`
- `CommandRequest.target`
  - 数据职责：当前低风险控制目标统一投影为 `strategies/<id>`、`adapters/<id>`、`subscriptions/<instrument_id>` 三类资源定位
- `Phase 2` close-out guardrail
  - 数据职责：当前浏览器可见 command/audit/config DTO 只覆盖低风险控制与恢复投影；不存在订单修改、批量交易或其他高风险不可逆命令的数据模型

当前浏览器可见的数据模型就是上述 admin DTO；任何内部运行时对象都必须先投影到这些 DTO，再通过 `nautilus_trader/admin` 暴露。

- `apps/admin-web/src/shared/ui/page-state.tsx`
  - 数据职责：统一浏览器侧 page-state view model；当前固定状态集合为 `loading`、`empty`、`error`、`stale`
- `apps/admin-web/src/features/read-only/admin-list-page.tsx`
  - 数据职责：通用只读列表 surface；在 bounded snapshot 之上复用表格渲染、可选 row drill-down，以及 trading ops 页面使用的前端 keyword filter 与分页状态（默认每页 `25` 行）
- `apps/admin-web/src/shared/realtime/invalidation-bus.ts`
  - 数据职责：浏览器侧 invalidation topic 投影；当前定义 `overview`、`nodes`、`strategies`、`adapters`、`audit`、`config`、`orders`、`fills`、`positions`、`accounts`、`risk`、`logs`、`catalog`、`playback`、`diagnostics` 十五个 topic，并把 `overview.*` / `snapshot.invalidate` 与 `command.*` 事件映射到对应 query invalidation
- `apps/admin-web/src/shared/realtime/command-receipt-bus.ts`
  - 数据职责：浏览器侧 command receipt 事件总线；把 websocket `command.*` 事件分发给当前页面的 receipt 卡片与 command hook
- `apps/admin-web/src/shared/query/query-client.ts`
  - 数据职责：浏览器侧 query key 与缓存入口；当前固定 `overview`、`nodes`、`strategies`、`adapters`、`audit`、`config`、`risk`、`diagnostics` 八组 `["admin", <resource>]` query key，并为 `orders`、`fills`、`positions`、`accounts`、`logs` 定义带 `limit` 维度的 `["admin", <resource>, <limit>]` query key；`catalog` 与 `playback` 额外带 `limit/start/end` 维度，确保 bounded window 是 cache key 的一部分
- `Phase 3` close-out guardrail
  - 数据职责：当前 trading-ops / diagnostics DTO 同时表达 bounded query window、timeline preview、operator_notes、partial 与 errors；浏览器不得构造无界历史读取，也不得把慢查询/partial failure 降级成只写 console 的隐式状态

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
