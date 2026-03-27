# API Contracts Truth

## Build And Packaging Contracts

- `pyproject.toml`
  - 包名：`nautilus_trader`
  - Python 版本：`>=3.12,<3.15`
  - 构建后端：`poetry.core.masonry.api`
  - 运行时依赖新增 `wsproto`，用于让 admin WebSocket endpoint 在真实 ASGI 服务器上保持可用
  - wheel/sdist 显式包含 `nautilus_trader/admin/static/**/*`，为 backend-hosted admin-web bundle 预留正式打包入口
  - 可选依赖组：`betfair`、`ib`、`docker`、`polymarket`、`visualization`
- `build.py`
  - 输入：环境变量 `RUSTUP_TOOLCHAIN`、`BUILD_MODE`、`PROFILE_MODE`、`ANNOTATION_MODE`、`PARALLEL_BUILD`、`COPY_TO_SOURCE`、`FORCE_STRIP`、`PYO3_ONLY`、`DRY_RUN`、`HIGH_PRECISION`
  - 契约：先编译 Rust 关键库，再构建 Cython 扩展，并按平台处理链接参数与精度模式
  - Rust toolchain 约束：默认遵循仓库根目录 `rust-toolchain.toml` 的 pin；`RUSTUP_TOOLCHAIN` 仅用于显式切换到 `nightly` 或特定版本 pin
- `nautilus_trader/admin/static/__init__.py`
  - 契约：admin-web bundle 查找顺序固定为 `NAUTILUS_ADMIN_FRONTEND_DIR` -> 包内 `nautilus_trader/admin/static` -> repo `apps/admin-web/dist`
  - 约束：只有包含 `index.html` 的目录才会被识别为有效前端 bundle
- `Cargo.toml`
  - 契约：声明 workspace members、共享依赖与 adapter/core crate 边界；新 Rust 生产模块必须进入 workspace
- `rust-toolchain.toml`
  - 契约：`channel` 是本地与 CI 共用的 Rust 单一真值 pin；不能出现“本地 latest stable、CI 固定旧版本”的漂移

## Runtime Interfaces

- Python import root 为 `nautilus_trader`；其包结构覆盖 `accounting`、`adapters`、`analysis`、`backtest`、`cache`、`common`、`config`、`core`、`data`、`execution`、`indicators`、`live`、`model`、`persistence`、`portfolio`、`risk`、`serialization`、`system`、`trading`
- `nautilus_trader.admin.schemas.CommandRequest`
  - 契约：管理命令请求统一携带 `command`、`target`、`payload`、`command_id`、`requested_at` 与 `requested_by`
  - 默认：当前固定为本机单人模式，`requested_by` 缺省值为 `local-operator`
- `nautilus_trader.admin.schemas.CommandReceipt`
  - 契约：所有管理控制结果都投影为 typed receipt，状态集合固定为 `accepted`、`completed`、`failed`
  - 字段：`command_id`、`command`、`target`、`status`、`recorded_at`、可选 `message` 与可选 `failure`
- `nautilus_trader.admin.schemas.CommandFailure`
  - 契约：失败回执与审计记录都复用同一错误体，至少包含稳定 `code`、人类可读 `message`、`retryable` 与结构化 `details`
- `nautilus_trader.admin.schemas.CommandErrorCode`
  - 契约：当前稳定错误码集合为 `invalid_request`、`not_found`、`conflict`、`not_supported`、`unavailable`、`internal_error`
- `nautilus_trader.admin.schemas.AuditRecord`
  - 契约：审计记录是 append-only 的浏览器/运维投影，固定包含单调递增 `sequence_id`、`command_id`、`status`、`payload`、`recorded_at` 与可选失败信息
- `nautilus_trader.admin.schemas.AuditSnapshot`
  - 契约：浏览器审计时间线读取模型；保留 `generated_at`、`partial`、`items`、`errors`，其中 `items` 按最新记录优先返回
- `nautilus_trader.admin.schemas.ConfigDiffEntry` / `RecoveryRunbook` / `ConfigDiffSnapshot`
  - 契约：浏览器配置恢复面读取模型；`ConfigDiffEntry` 表达 guardrail key、期望值、当前值与状态，`RecoveryRunbook` 提供可执行恢复步骤，`ConfigDiffSnapshot` 负责把二者打包为单次只读投影
- `POST /api/admin/commands/strategies/{strategy_id}/start|stop`
  - 契约：仅暴露策略启停这类低风险控制动作，返回 `202 Accepted` + `CommandReceipt`
- `POST /api/admin/commands/adapters/{adapter_id}/connect|disconnect`
  - 契约：仅暴露适配器连接控制，返回 `202 Accepted` + `CommandReceipt`
- `POST /api/admin/commands/subscriptions/{instrument_id}/subscribe|unsubscribe`
  - 契约：仅暴露行情订阅控制，返回 `202 Accepted` + `CommandReceipt`
- `Phase 2` close-out contract
  - 契约：当前 mutating admin surface 只允许策略启停、适配器连接控制与行情订阅控制；不存在任何订单修改、批量交易或高风险不可逆 command endpoint
- `GET /api/admin/audit`
  - 契约：返回浏览器可见的 append-only 审计时间线，HTTP body 为 `AuditSnapshot`
- `GET /api/admin/config/diff`
  - 契约：返回本机 control-plane guardrail / runbook 只读投影，HTTP body 为 `ConfigDiffSnapshot`
- `/ws/admin/events`
  - 契约：当前支持 `overview` 与 `commands` 两个订阅 channel
  - `commands` channel 事件类型固定为 `command.accepted`、`command.completed`、`command.failed`，并通过 `receipt` 字段携带 `CommandReceipt`
- `crates/cli` 提供命令行接口产物；相关发布与打包流程由 `.github/workflows/cli-binaries.yml` 驱动
- `schema/sql/*.sql` 是持久化数据库对象定义接口，面向 `persistence` 层
- `examples/*` 与 `tests/*` 依赖上述 Python/Rust surface，不单独定义产品 API
- GitHub branch protection 通过 `gh api` 读取与校验
- GitHub Actions 暴露 `governance-check` 与 `pr-gate` 两个 required check
- `pr-gate` workflow 在 `pull_request` 事件上运行，并以本地 pre-PR review record 作为 review gate 输入
- `scripts/pre-pr-check.ps1` 读取 issue 链接、truth-doc 映射、memory 更新和 `workspace/handoffs/review-resolution-issue-<issue>.md` 作为本地 review 信号
- PR 元数据通过 `.github/PULL_REQUEST_TEMPLATE.md` 和 GitHub 事件负载传递

## Admin Read-Only Control Plane Contracts

- `nautilus_trader/admin/app.py`
  - 暴露 FastAPI surface：`GET /api/admin/health`、`GET /api/admin/overview`、`GET /api/admin/nodes`、`GET /api/admin/strategies`、`GET /api/admin/adapters`、`GET /api/admin/orders`、`GET /api/admin/fills`、`GET /api/admin/positions`、`GET /api/admin/accounts`、`GET /api/admin/risk`、`GET /api/admin/logs`、`GET /api/admin/catalog`、`GET /api/admin/playback`、`GET /api/admin/diagnostics`、`GET /api/admin/backtests`、`GET /api/admin/reports`、`GET /api/admin/audit`、`GET /api/admin/config/diff`，以及低风险 `POST /api/admin/commands/*`
  - 当前还负责交付浏览器入口：`GET /` 返回 bundle `index.html`；`GET /{frontend_path:path}` 在不命中 `/api/*` 与 `/ws/*` 时优先返回静态资产，否则回退到同一个 `index.html` 以支持 SPA deep link
  - `orders`、`fills`、`positions`、`accounts`、`logs`、`catalog`、`playback`、`backtests` 与 `reports` 九个列表/preview endpoint 都要求 `limit` query 参数满足 `1 <= limit <= 500`，默认值为 `100`
  - `catalog` 与 `playback` 额外要求浏览器显式携带 `start_time` / `end_time` UTC query 参数；后端必须把该 bounded window 原样回显到 DTO，避免无界历史查询
  - 低风险 mutating command endpoint 仍限定为策略/适配器/订阅控制；高风险交易命令不在当前 surface 中
- `nautilus_trader/admin/schemas.py`
  - 定义浏览器可见 snapshot DTO：`OverviewSnapshot`、`NodesSnapshot`、`StrategiesSnapshot`、`AdaptersSnapshot`、`OrdersSnapshot`、`FillsSnapshot`、`PositionsSnapshot`、`AccountsSnapshot`、`RiskSnapshot`、`LogsSnapshot`、`CatalogSnapshot`、`PlaybackSnapshot`、`DiagnosticsSnapshot`、`BacktestsSnapshot`、`ReportsSnapshot`、`AuditSnapshot`、`ConfigDiffSnapshot`
  - 所有列表 snapshot 都保留 `generated_at`、`partial`、`items`、`errors`；bounded list snapshot 额外保留 `limit`
  - `PositionSummary` 在 Phase 3A 额外暴露可选的 `position_id`、`entry_price`、`unrealized_pnl`、`realized_pnl`、`opened_at` 与 `updated_at`，供浏览器 drill-down 使用
  - `AccountsSnapshot` 在 Phase 3B 额外保留跨账户 `summary`，并把 `AccountSummary` 扩展为 venue / account_type / base_currency、balances、exposures、alerts 等 drill-down 字段
  - `RiskSnapshot` 固定包含 `summary`、`events`、`blocks`、`partial` 与 `errors`，用于浏览器 risk-center page 展示跨账户风险摘要和当前 block
  - `CatalogSnapshot` 固定包含 bounded `limit`、`history_query`、`items`、`operator_notes` 与 `errors`；`PlaybackSnapshot` 固定包含 bounded `request`、`timeline`、`events`、`operator_notes` 与 `errors`；`DiagnosticsSnapshot` 固定包含 `summary`、`links`、`query_timings`、`partial` 与 `errors`
  - `BacktestsSnapshot` 固定包含 bounded `limit`、`items`、`partial` 与 `errors`；`BacktestTaskSummary` 表达 task/run/strategy/catalog/instrument 标识、进度、状态、时间戳、关联 `report_id` 与结果摘要
  - `ReportsSnapshot` 固定包含 bounded `limit`、`items`、`partial` 与 `errors`；`ReportSummary` 表达 report/run/strategy/instrument 标识、收益摘要、回撤/Sharpe/win-rate、artifact families 与操作员可见 summary
- `apps/admin-web/src/shared/types/admin.ts`
  - 是前端对上述 DTO、command receipt event 与 config/audit 恢复模型的 TypeScript 镜像；前端只消费 admin DTO，不直接序列化内部 runtime object
- `apps/admin-web/src/shared/api/admin-client.ts`
  - 固定浏览器到后端的读取契约：`overview`、`nodes`、`strategies`、`adapters`、`audit`、`config/diff`、`risk`、`diagnostics` 走无参 `GET`；`orders`、`fills`、`positions`、`accounts`、`logs`、`backtests`、`reports` 走带 `limit` 的 `GET`；`catalog` 与 `playback` 走带 `limit + start_time + end_time` 的 `GET`
  - 固定浏览器到后端的低风险 command 契约：策略与适配器控制通过 `POST /api/admin/commands/*` 返回 typed `CommandReceipt`
  - `READ_ONLY_DEFAULT_LIMIT` 当前固定为 `100`；`CATALOG_DEFAULT_START_TIME/END_TIME` 与 `PLAYBACK_DEFAULT_START_TIME/END_TIME` 固定了浏览器默认 bounded query window
- `apps/admin-web/src/app/routes/__root.tsx` / `apps/admin-web/src/app/layouts/workbench-shell.tsx`
  - 契约：浏览器根路由必须先进入 unified workbench shell，再渲染具体 route page；该 shell 固定暴露 `Operations` 与 `Analysis` 两个入口 link，并在不改变既有 admin route path 的前提下对页面进行分组导航
- `apps/admin-web/src/shared/workspaces/workspace-store.ts`
  - 契约：浏览器本地 workspace state 固定写入 `localStorage["nautilus-admin-workspace"]`
  - 字段：`activeWorkbench`、`lastRouteByWorkbench`、`recentRoutes`、`routePreferences`
  - `routePreferences` 当前只表达 `filterText` 与 `layout`，且 `layout` 固定为表格型 `"table"`；该模型仅服务于本地单用户工作台，不对应任何后端 DTO 或同步接口
- `apps/admin-web/src/features/orders/orders-page.tsx`
  - `/orders` route 在浏览器侧以 `Blotter` 文案呈现，但仍消费 `/api/admin/orders?limit=<n>` snapshot；不引入新的写接口或独立后端路由
  - `Blotter`、`Fills`、`Positions` trading surfaces 当前都在浏览器侧提供 keyword filter，且只在单次 bounded snapshot 内做前端过滤与分页，不把无界查询下推到后端
- `apps/admin-web/src/features/accounts/accounts-page.tsx` / `apps/admin-web/src/features/risk/risk-page.tsx`
  - `Accounts` 页面继续消费 bounded `/api/admin/accounts?limit=<n>`，但会在列表上方显示 balance / margin / exposure summary，并使用 `AccountSummary` drill-down 展示 per-account balances、exposures 与 alerts
  - `Risk center` 页面固定消费 `/api/admin/risk`，显示 `RiskSummary` metric、risk events 与 active blocks；页面只读，不附带任何解除 block 或修改风险参数的写接口
- `apps/admin-web/src/features/catalog/catalog-page.tsx` / `apps/admin-web/src/features/playback/playback-page.tsx` / `apps/admin-web/src/features/diagnostics/diagnostics-page.tsx`
  - `Catalog` 页面固定消费 bounded `/api/admin/catalog?limit=<n>&start_time=<utc>&end_time=<utc>`，显示 browse item、history query feedback 与 operator note，并继续复用 `AdminListPage` 的 filter / pagination / drill-down
  - `Playback` 页面固定消费 bounded `/api/admin/playback?limit=<n>&start_time=<utc>&end_time=<utc>`，显示 `PlaybackRequest`、timeline preview 与 projected event table；图表 runtime 仅允许封装在 `playback-preview-chart.tsx`
  - `Diagnostics` 页面固定消费 `/api/admin/diagnostics`，显示 `DiagnosticsSummary`、link health、query timing 与显式 `errors`，partial failure 必须在页面上可见
- `Phase 3` close-out contract
  - `Blotter`、`Fills`、`Positions`、`Accounts`、`Risk center`、`Catalog`、`Playback` 与 `Diagnostics` 当前共同构成日常运维读工作台，但仍只暴露 bounded read-only snapshot / preview 契约，不引入任何新的交易写接口
  - `Catalog` / `Playback` 的 UTC window、`operator_notes` 与 `errors`，以及 `Diagnostics` 的 link health / query timing / partial error 都必须作为浏览器可见 DTO 字段返回，避免大查询、慢查询或链路退化时静默卡死 UI
- `Phase 4A` analysis contract
  - `Backtests` 与 `Reports` 当前把 analysis workflow 接入同一 admin workbench，但仍只暴露 bounded read-only task/report snapshot；后端不提供 backtest start/stop、report regeneration 或策略编辑类写接口
  - `Backtests` 通过 `report_id` 把 task summary 与已生成报告建立松耦合关联；`Reports` 通过 `artifacts` 列表声明浏览器可见的只读结果族，供操作员回看 orders/fills/positions/account 报告，但不直接跨页调用内部分析对象
- `Phase 4B` workbench contract
  - unified workbench 只重组现有浏览器路由，不引入新的 HTTP / WS surface；`Operations` 与 `Analysis` entry link 的落点始终解析到已有 route path
  - workspace model 只在浏览器本地维护 workbench 最近访问、route 偏好和入口跳转目的地；任何 review、merge 或运行时自动化都不能依赖它作为仓库级真值
- `apps/admin-web/src/shared/realtime/admin-events.ts`
  - 固定浏览器侧 WS 入口为 `/ws/admin/events`
  - 当前识别的事件类型是 `subscribed`、`connection.state`、`overview.updated`、`snapshot.invalidate`、`command.accepted`、`command.completed`、`command.failed`、`server.error`
  - 连接建立后同时订阅 `overview` 与 `commands` channel，并把读到的事件交给 invalidation bus、command receipt bus 与运行态状态管理
- `apps/admin-web/scripts/check-bundle-budget.mjs`
  - 契约：当前对生产构建产物执行显式 budget gate；最大单个 JS 资产预算为 `550 KiB` 原始大小 / `180 KiB` gzip，大 CSS 资产预算为 `16 KiB` 原始大小 / `4 KiB` gzip
- `apps/admin-web/playwright.config.ts`
  - 契约：Playwright smoke 只针对 backend-hosted bundle 运行；必须在 `dist/index.html` 已存在时启动，并通过测试专用 Python 启动脚本拉起同源 FastAPI shell

## Repository Operational Interfaces

- GitHub Actions 公开 `build`、`build-v2`、`coverage`、`docker`、`performance`、`security-audit`、`build-docs`、`nightly-tests` 等工程接口
- `governance-check` 与 `pr-gate` 继续作为当前独立仓库的合并门禁
- `build.yml` 的 push 触发与 `cargo-deny` / `cargo-vet` 分支条件必须对齐 `main`，否则受保护分支不会运行供应链检查
- `build.yml` 中的 `frontend-admin-web` job 当前固定执行 `npm ci`、轻量 Python runtime 依赖安装、Playwright Chromium 安装、frontend lint、Vitest、production build、bundle budget gate 与 Playwright smoke；该 job 是 admin-web 交付链路的 CI 真值
- `codeql-analysis.yml` 的 `pull_request` 分支过滤必须包含 `main`，否则面向 `main` 的 PR 不会运行 CodeQL
- `scripts/init-project.ps1` / `scripts/init-project.sh` 和 `scripts/check-governance.ps1` / `scripts/check-governance.sh` 是本仓库 bootstrap 与治理校验入口
- `scripts/sync-issues.ps1` / `scripts/sync-issues.sh`、`scripts/build-workset.ps1` / `scripts/build-workset.sh`、`scripts/close-loop.ps1` / `scripts/close-loop.sh` 负责 issue 同步、编排产物生成和 merge 后 memory 回写
- `scripts/ensure-local-runtime.ps1`、`scripts/start-local-agentboard.ps1`、`scripts/start-main-agent.ps1`、`scripts/dispatch-issue.ps1`、`scripts/sync-remote-execution.ps1`、`scripts/prepare-remote-pr.ps1` 是当前本机执行链入口
- `scripts/pre-pr-check.ps1` 是当前本地 PR gate 预检查入口
- `scripts/rust-toolchain.sh` 负责把 Rust pin 暴露给 CI；`scripts/install-capnp.sh` 负责在 Linux/macOS 本地安装仓库要求的 Cap'n Proto 版本，并兼容 root 与非 root 环境

## Non-Contracts

- `memory/`、`workspace/` 和 `docs/system-truth/` 不是产品运行时 API
