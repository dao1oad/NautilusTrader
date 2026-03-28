# Architecture Truth

## System

当前仓库是一个独立维护的 `NautilusTrader` 衍生仓库，由 Rust workspace、Python/Cython 包层、PyO3 桥接层、SQL 持久化 schema、示例与测试，以及治理控制面共同组成。

## Primary Code Planes

- `crates/`: Rust workspace，承载核心领域模型、回测、实盘、网络、持久化、风险、组合管理、CLI 与各交易所/数据源适配器。
- `nautilus_trader/`: 用户可见的 Python 包源码树，包含大量 Cython `.pyx`/`.pxd` 模块与高层 Python 接口。
- `nautilus_trader/admin/`: 管理控制面后端；负责把运行态状态、控制命令契约、审计记录以及 `Phase 4A` 的 backtest/report 摘要投影成稳定的 admin DTO，而不是把内部 `live`/`execution` object 直接暴露给浏览器。
- `nautilus_trader/admin/static/`: 管理控制面前端交付目录；负责解析最终 admin-web bundle 的查找顺序（显式环境变量、包内静态目录、repo `apps/admin-web/dist`），并作为 wheel/sdist 中可携带的前端静态产物落点。
- `apps/admin-web/`: 浏览器管理控制台；负责组合 routed operator surface、shared query/realtime runtime、terminal-editorial workbench shell、bounded trading ops / analysis 页面、浏览器本地 workbench/workspace 状态，以及 `Phase 4C` 的 Playwright smoke / bundle budget delivery tooling，而不是直接接入底层 venue/runtime object。
- `python/nautilus_trader/`: Python/PyO3 暴露层与类型桩，负责把编译产物组织成稳定的 Python import surface。
- `schema/sql/`: 持久化后端的 SQL 类型、表、分区与函数定义。
- `examples/`: 回测、实盘、sandbox 与工具示例。
- `tests/`: 单元、集成、验收、性能、内存泄漏测试和测试数据。
- `scripts/`、`.github/`、`ops/`、`memory/`、`governance/`: 当前仓库保留的治理与自动化控制面。

## Build Model

- `pyproject.toml` 定义 Python 包 `nautilus_trader`，构建后端为 `poetry.core`，实际编译流程由根目录 `build.py` 驱动。
- `build.py` 先通过 `cargo build` 编译关键 Rust 库，再执行 Cython 扩展构建，并可选择把生成的二进制复制回源码树。
- `rust-toolchain.toml` 是 Rust 版本 pin 的单一真值；本地开发与 CI 都不应绕过这个 pin 漂移到不同 `stable` 版本。
- `Cargo.toml` 定义单一 Rust workspace；当前 workspace 版本为 `0.54.0`，Python 包版本为 `1.224.0`，两层版本号并不强制一致。

## Invariants

- 主 agent 在本地编排
- bounded issue 执行通过同机 `codex-orchestrator`
- 默认开启 truth-doc 门禁
- `main` 只通过 PR 合并，初始化阶段除外
- 开 PR 前必须完成本地 pre-PR review 与 review 闭环记录
- 当前仓库允许单维护者模式：GitHub approving review 计数可配置为 `0`，但不能替代本地 pre-PR review
- 当前仓库保留自己的 `.git`、`origin` 和治理规则；上游源码仅作为文件快照导入
- Python 运行时表面必须保持 `nautilus_trader/`、`python/nautilus_trader/`、`crates/pyo3` 与 Rust core crates 的接口一致性
- `Phase 2A` 的命令契约保持本机单人操作模式：`CommandRequest` 默认 `requested_by=local-operator`，所有控制结果都必须先落到 typed receipt 和 append-only audit record，再由后续 phase 绑定到真实控制 endpoint。
- `Phase 2B` 只开放低风险控制面：策略启停、适配器连接控制、行情订阅控制；HTTP route 必须返回 typed receipt，WS 只流出 receipt 事件，不引入任何交易类命令。
- `Phase 2C` 把低风险 command flow 接到浏览器：所有 mutating action 都必须先经过显式确认，对应页面持续显示最新 receipt，并新增 `Audit` 与 `Config` 恢复面用于追溯本机 control-plane 状态。
- `Phase 3A` 的 `Blotter`、`Fills` 与 `Positions` surface 必须保持 bounded read-only 工作流：`orders`、`fills`、`positions` 都通过 `limit` 约束读取，浏览器 drill-down 只消费已投影到 `OrderSummary`、`FillSummary`、`PositionSummary` 的字段，不绕过 admin DTO，也不引入任何交易写接口。
- `Phase 3B` 的 `Accounts` 与 `Risk center` surface 必须继续保持 query-backed read-only 工作流：`accounts` 仍通过 `limit` 约束读取，但额外暴露 balance / margin / exposure summary 和 account drill-down；`risk` 作为无参 snapshot 暴露跨账户风险摘要、事件与 block，不引入任何新的 mutating trading route。
- `Phase 3C` 的 `Catalog` 与 `Playback` surface 必须在 HTTP 契约上同时绑定 `limit + UTC time range`，并把这些边界原样回显到浏览器可见 DTO；`Diagnostics` surface 必须显式暴露 link health、query timing 与 partial error，而不是把慢查询/链路失败静默吞掉。
- `Phase 3C` 新引入的图表依赖只能落在 `apps/admin-web/src/features/playback/*`，用于 bounded playback preview；其余页面继续复用通用表格/metric/card 组件，不扩散出新的 chart runtime。
- `Phase 4A` 的 `Backtests` 与 `Reports` surface 必须继续保持 bounded read-only analysis workflow：`/api/admin/backtests` 与 `/api/admin/reports` 只接受 `limit` 约束读取，后端只投影任务/报告摘要与关联 artifact，浏览器只允许浏览、过滤和 drill-down 已有结果，不引入回测启动、调度编辑或策略编辑器。
- `Phase 4B` 的 unified workbench shell 必须把现有 route tree 分成 `Operations` 与 `Analysis` 两个浏览器入口，并把 active workbench、每个 workbench 的最近路由、recent views，以及每个 route 的 layout/filter 偏好保存在浏览器本地存储中；该状态不能升级成服务端 session、多用户同步或新的后端 API。
- `Phase 4C` 的最终交付模型固定为“同源 backend-hosted web bundle”：FastAPI 在不遮蔽 `/api/admin/*` 与 `/ws/admin/events` 的前提下托管构建后的 admin-web `index.html` 与静态资产；bundle 查找顺序固定为 `NAUTILUS_ADMIN_FRONTEND_DIR` -> `nautilus_trader/admin/static` -> `apps/admin-web/dist`。
- `Phase 4C` 的 CI/交付硬化固定包含三条门禁：前端生产构建、bundle budget 检查、以及针对 backend-hosted bundle 的 Playwright smoke；桌面壳只保留评估结论，不进入当前实现面。
- `Phase 4` 当前已经收敛为单一主线路径：操作员通过同一个浏览器 workbench 在 `Operations` 与 `Analysis` 间切换，并始终命中 FastAPI 同源托管的 admin-web bundle；不存在并行的桌面壳、独立前端部署真值或第二套导航/runtime 模型。
- 当前 admin-web 的页面上下文收敛为 project-owned terminal-editorial shell：route page 通过 `WorkbenchShellMeta` 发布 `pageTitle/workbenchCopy/statusSummary/lastUpdated`，统一 runtime strip 与页面 header 只消费这些浏览器本地元数据，不新增任何后端 API、session 或远端偏好同步契约。
- 当前 admin-web 的界面文案国际化固定为浏览器 display-only 模型：仅支持 `en` 与 `zh-CN` 两个 locale，locale 状态由浏览器本地存储与 navigator 解析驱动；后端 DTO、payload message、status、ID、target、timestamp 与 route path 不会因 locale 切换而改变。
- provider-scoped i18n catalog override 当前必须先与内置英文 catalog 合并，再让非默认 locale 的缺失 key 回退到这份合并后的英文基线；这样可以允许 branch- or test-scoped partial override，同时保持缺失翻译的稳定兜底语义。
- `schema/sql/` 变更属于持久化契约变更，必须同步更新 `data_model` 与 `api_contracts`
- 本机 `agentboard` 提供对 `codex-orchestrator` 会话的观测与人工接管能力
