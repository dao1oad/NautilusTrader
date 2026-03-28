# Integrations Truth

## Trading And Data Integrations

- 当前代码树已包含以下 adapter 集成边界：`architect_ax`、`betfair`、`binance`、`bitmex`、`blockchain`、`bybit`、`databento`、`deribit`、`dydx`、`hyperliquid`、`kraken`、`okx`、`polymarket`、`sandbox`、`tardis`
- 集成说明位于 `docs/integrations/`，对应行为验证主要位于 `tests/integration_tests/adapters/`

## Toolchain Integrations

- Rust/Cargo workspace、Cython、PyO3、Poetry build backend、uv lockfile、Docker、Codecov、Codspeed 与 GitHub Actions 共同组成工程工具链
- `.github/workflows/` 已包含构建、覆盖率、Docker、性能、安全审计、文档与 CLI 发布相关自动化

## Admin Control Plane Integrations

- `apps/admin-web` 通过浏览器 `fetch` 代理到本机 FastAPI admin surface：trading ops / analysis 当前消费 bounded `GET /api/admin/orders|fills|positions|accounts|logs|backtests|reports?limit=<n>`、bounded `GET /api/admin/catalog|playback?limit=<n>&start_time=<utc>&end_time=<utc>`，以及无参 `GET /api/admin/risk|diagnostics`，其中 `/orders` 在 UI 上以 `Blotter` 呈现；低风险 command flow 继续消费 `POST /api/admin/commands/strategies/*`、`POST /api/admin/commands/adapters/*`，恢复面消费 `GET /api/admin/audit` 与 `GET /api/admin/config/diff`
- `apps/admin-web/src/shared/realtime/admin-events.ts` 通过 `/ws/admin/events` 同时订阅 `overview` 与 `commands` channel，并把 `snapshot.invalidate` / `command.*` 事件桥接到 shared invalidation / receipt bus；`fills`、`positions`、`accounts`、`risk`、`catalog`、`playback`、`diagnostics`、`backtests` 与 `reports` surface 依赖同一 invalidation 语义刷新 snapshot
- `nautilus_trader/admin/services/fills.py` 当前把 execution/cache 中已有的 fills 数据投影成 `FillSummary` / `FillsSnapshot`，供浏览器只读消费；它不直接接入交易 venue，也不承担命令执行职责。`nautilus_trader/admin/services/accounts.py` 与 `nautilus_trader/admin/services/risk.py` 同样只负责 account/risk 投影，不直接执行业务控制。`nautilus_trader/admin/services/catalog.py` 与 `nautilus_trader/admin/services/diagnostics.py` 也只负责 catalog/history/playback/diagnostics projection，不直接调度真实回放或修改链路状态。`nautilus_trader/admin/services/backtests.py` 与 `nautilus_trader/admin/services/reports.py` 只负责把现有回测任务/报告结果投影成管理台摘要，不直接启动回测或生成新报告。
- `apps/admin-web/src/app/layouts/workbench-shell.tsx` 通过浏览器 `localStorage` 与 `apps/admin-web/src/shared/workspaces/workspace-store.ts` 协作，持久化 `Operations/Analysis` 入口、recent views 与 per-route layout/filter 偏好；该集成是严格本地的，不会把 workspace state 同步到 FastAPI、WebSocket 或 GitHub 侧自动化
- `apps/admin-web/src/main.tsx` 当前把 `@radix-ui/themes` 作为 admin-web 的基础语义 primitive 层接入；最终视觉身份仍由仓库自有 CSS token 与 `workbench-header` / `section-panel` / `signal-pill` / `metric-tile` / `terminal-table` 等 project-owned 组件负责，不把 Radix 默认观感暴露成产品设计真值
- `apps/admin-web/src/app/workbench-shell-meta.tsx` 当前把 route page 与 shell runtime strip / page header 接起来：overview、read-only list page、catalog、playback、diagnostics 等页面都通过同一浏览器内 context 集成标题、说明、状态与 last-updated 信号，而不是额外请求新的后端接口
- `apps/admin-web/src/shared/i18n/*` 当前把浏览器 `localStorage["nautilus-admin-locale"]`、`navigator.languages` 与 `en` / `zh-CN` message catalog 集成起来，只翻译 admin-web 自有 shell/page 文案；它不会向 FastAPI 发送 locale 协商，也不会翻译后端 snapshot / receipt / audit / config payload 中的原始字段值
- `nautilus_trader/admin/app.py` 当前把构建后的 admin-web bundle 作为同源静态入口托管；bundle 路径通过 `NAUTILUS_ADMIN_FRONTEND_DIR`、包内 `nautilus_trader/admin/static` 与 repo `apps/admin-web/dist` 三者按顺序解析，因此浏览器最终以同一 origin 同时命中 HTML、静态资产、REST 与 WebSocket
- `apps/admin-web/src/features/playback/playback-preview-chart.tsx` 是当前唯一引入 `lightweight-charts` 的集成点；图表依赖被局部封装在 playback page，用于渲染 bounded timeline preview，不扩散到其他 admin-web route
- `apps/admin-web/scripts/check-bundle-budget.mjs` 与 `.github/workflows/build.yml` 的 `frontend-admin-web` job 当前共同形成 admin-web 交付 budget gate：CI 会在 production build 后校验 JS/CSS 预算，再执行 Playwright smoke，确保交付模型不是纯文档约定
- `apps/admin-web/playwright.config.ts` 与 `apps/admin-web/tests/e2e/serve_admin_app.py` 当前通过轻量 Python 依赖 + Chromium browser 把 Playwright 对接到 backend-hosted bundle；该集成只用于验证最终交付路径，不替代生产启动入口
- `nautilus_trader/admin/services/config.py` 当前把本机 control-plane guardrail 与 recovery runbook 作为浏览器只读 projection 暴露，不直接接入交易 venue 或远端配置中心
- `Phase 3` close-out integration boundary 当前要求浏览器所有 trading ops / diagnostics workflow 都通过 bounded snapshot / preview DTO 协作；`catalog` / `playback` 的 UTC window、`operator_notes` 与 `errors`，以及 `diagnostics` 的 partial / slow-query feedback 必须跨 HTTP 和 UI 完整透传，不允许依赖隐式超时或 console log 暗示异常
- `Phase 4A` integration boundary 当前要求 `Backtests` / `Reports` workflow 继续通过 bounded snapshot DTO 协作；`report_id` 与 `artifacts` 只作为浏览器可见导航线索，不直接把 admin-web 绑定到内部 backtest scheduler 或 analysis runtime object
- `Phase 4B` integration boundary 当前要求 unified workbench 只接入浏览器 `localStorage` 这一条本地状态链路；它不能引入新的后端偏好持久化、远端用户配置同步或 CI/merge gate 对 workspace state 的依赖
- `Phase 4C` integration boundary 当前要求 backend-hosted bundle、Playwright smoke、bundle budget gate 与轻量 Python WebSocket support 一起闭环；Tauri 结论只落在评估文档中，不引入新的桌面运行时集成
- `Phase 4` close-out integration boundary 当前要求运维与分析 workflow 通过同一个同源 FastAPI + admin-web bundle 集成闭环，并由同一套 build/bundle-budget/Playwright 验证最终交付路径；不再保留独立桌面 runtime、Vite-only 生产路径或第二套发布入口

## Repository Governance Integrations

- 使用 `gh` 同步 issues、读取 branch protection
- GitHub Actions 继续负责 `governance-check` 和 `pr-gate`
- `build.yml` 与 `codeql-analysis.yml` 需要对齐受保护分支 `main`；CodeQL 覆盖面向 `main` 的 PR，供应链检查覆盖 push 到 `main`
- 远端 `main` 保护需启用 PR review、required checks、conversation resolution 和 admin enforcement
- `codex-orchestrator` 在本机 worktree 执行 bounded issue packet，`agentboard` 通过 `http://127.0.0.1:8088` 提供会话观测

## Codex

- 主 agent 本地执行
- bounded issue 执行在本机 `codex-orchestrator`
- review 在本地 pre-PR 阶段完成，并通过 review record 落盘

## Current Status

- GitHub CLI 已认证
- 当前仓库已绑定自己的 `origin`：`dao1oad/NautilusTrader`
- 当前仓库未保留 `nautechsystems/nautilus_trader` 作为 remote
