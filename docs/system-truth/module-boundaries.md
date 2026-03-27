# Module Boundaries Truth

## Product Boundaries

- `crates/analysis` 到 `crates/trading`: Rust 核心领域与运行时模块，负责性能关键路径。
- `crates/adapters/*`: 交易所、数据源与 sandbox 适配器；边界职责是协议接入、字段转换与 venue-specific 行为，不承载通用核心逻辑。
- `nautilus_trader/*`: Python/Cython 域层，向策略、回测、实盘和工具使用者暴露统一包结构。
- `nautilus_trader/admin/*`: 管理控制面边界；负责把 `live`、`execution`、`portfolio`、`accounting` 与日志 runtime 投影到稳定的只读 snapshot、控制命令 request/receipt 与 audit record，不暴露内部 runtime object，也不在 `Phase 2A` 直接承载高风险交易命令。`Phase 3A` 的 fills snapshot builder / position drill-down 字段，以及 `Phase 3B` 的 account balance / margin / exposure projection 与 `risk` snapshot，都仍属于这种只读 projection。
- `python/nautilus_trader/*`: PyO3 输出层与类型桩；职责是稳定 Python import surface，而不是重新实现业务逻辑。
- `apps/admin-web/src/app/*`: 管理控制台壳层、路由树与运行态上下文；负责组合 `Overview/Nodes/.../Audit/Config/Blotter/Fills/Positions/Accounts/Risk Center` 页面与 shared websocket runtime，而不是直接读取底层 runtime object。
- `apps/admin-web/src/features/*`: 按页面切分的 route surface；`strategies`、`adapters` 可以通过 shared command hook 触发低风险 POST，但 feature 本身只负责编排确认 UI、receipt 展示与 query-backed 页面逻辑。`orders`、`fills`、`positions`、`accounts` 与 `risk` 等 trading ops 页面仍保持只读，只能在 bounded snapshot 上做筛选、分页、summary render 与 drill-down。
- `apps/admin-web/src/shared/*`: admin DTO 类型镜像、API client、query key、realtime invalidation、command receipt bus 与 shared page-state primitive；是前端跨页面共享层，不得越界成 runtime orchestration layer。
- `schema/sql/*`: 数据库持久化对象定义；其边界与 `crates/persistence`、`nautilus_trader/persistence` 对齐。
- `examples/*`: 示例与演示流，不作为产品真值来源。
- `tests/*`: 验证层，不作为产品真值来源。

## Control Plane Boundaries

- `governance/`: 面向人的规则、流程与门槛说明。
- `memory/`: 运行态记忆与执行账本，不承担静态真值职责。
- `docs/system-truth/`: 静态系统真值，约束真实代码与自动化边界。
- `ops/`: 机器可读配置、review gate 与 truth 绑定规则。
- `scripts/`: 本地执行入口，既包含治理脚本，也包含上游工程脚本。
- `.github/`: 远端 CI/CD、issue/PR 模板与治理 gate。
- `workspace/`: 运行时产物与中间文件，不作为生产路径。

## Boundary Rules

- 新的 venue adapter 应进入 `crates/adapters/<venue>`，并在 Python surface、文档与测试层保持同名或同职责映射。
- 性能关键逻辑优先进入 Rust crates；Python/Cython 层负责用户接口、组合装配和编译后暴露。
- `nautilus_trader/admin` 与 `apps/admin-web` 之间只通过 admin snapshot DTO、WS 事件和 query/invalidation 语义通信，前端不得跨边界直接依赖内部 runtime object。
- `Phase 2` 当前只允许低风险 command flow，而且 mutating POST 前必须经过浏览器显式确认；高风险交易命令仍需在未来 phase 单独扩展边界、契约与 review gate。
- `Phase 3A` 的 `Blotter` / `Fills` / `Positions` surface 只能消费 bounded snapshot；`apps/admin-web/src/features/read-only/admin-list-page.tsx` 可以在浏览器侧复用 keyword filter、分页和 row drill-down，但不能把无界查询、写操作或内部 runtime object 泄露到 UI 边界。
- `Phase 3B` 的 `Accounts` 页面可以在 `AdminListPage` 之上追加 summary metric 和 account drill-down，但仍只能消费 `AccountsSnapshot` 中已投影的 balances / exposure / alert 字段；`Risk center` 页面只能消费 `RiskSnapshot`，不能越界成真实风险引擎操作台。
- `nautilus_trader/admin/services/commands.py` 只负责命令 receipt/failure 组装与审计/事件联动；`nautilus_trader/admin/services/audit.py` 只负责 append-only 审计记录投影；`nautilus_trader/admin/services/config.py` 只负责 control-plane config diff / runbook snapshot。三者都不能越界成完整的运行时控制编排器。
- `nautilus_trader/admin/services/fills.py` 只负责把既有 fills runtime 状态投影成浏览器可见 DTO；`PositionSummary` 的 drill-down 字段只表达读取投影，不得借机承载持仓变更或交易命令。`nautilus_trader/admin/services/accounts.py` 只负责 account summary / drill-down 投影；`nautilus_trader/admin/services/risk.py` 只负责 risk summary / events / blocks 投影。
- `nautilus_trader/admin/app.py` 的 command route 仅允许低风险策略/适配器/订阅控制，并且必须返回 `CommandReceipt`；`GET /api/admin/audit`、`GET /api/admin/config/diff` 与 `GET /api/admin/risk` 只暴露 browser-facing 恢复/风险投影；`nautilus_trader/admin/ws.py` 只负责把 `command.accepted/completed/failed` 事件广播给订阅者。
- `tests/`、`examples/`、`memory/`、`workspace/` 不得被当作产品静态真值。
- `ops/review-gates.yaml` 中的 review 约束只放宽人工 approving review，不放宽本地 pre-PR review 或 PR-only 约束。
- 本地构建辅助脚本必须在 Linux 开发机和容器内可直接运行，不能隐式要求 Windows-only 路径或在 root 环境下强依赖 `sudo`。
