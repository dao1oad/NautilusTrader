# Integrations Truth

## Trading And Data Integrations

- 当前代码树已包含以下 adapter 集成边界：`architect_ax`、`betfair`、`binance`、`bitmex`、`blockchain`、`bybit`、`databento`、`deribit`、`dydx`、`hyperliquid`、`kraken`、`okx`、`polymarket`、`sandbox`、`tardis`
- 集成说明位于 `docs/integrations/`，对应行为验证主要位于 `tests/integration_tests/adapters/`

## Toolchain Integrations

- Rust/Cargo workspace、Cython、PyO3、Poetry build backend、uv lockfile、Docker、Codecov、Codspeed 与 GitHub Actions 共同组成工程工具链
- `.github/workflows/` 已包含构建、覆盖率、Docker、性能、安全审计、文档与 CLI 发布相关自动化

## Admin Control Plane Integrations

- `apps/admin-web` 通过浏览器 `fetch` 代理到本机 FastAPI admin surface：trading ops 当前消费 bounded `GET /api/admin/orders|fills|positions|accounts?limit=<n>`、bounded `GET /api/admin/catalog|playback?limit=<n>&start_time=<utc>&end_time=<utc>`，以及无参 `GET /api/admin/risk|diagnostics`，其中 `/orders` 在 UI 上以 `Blotter` 呈现；低风险 command flow 继续消费 `POST /api/admin/commands/strategies/*`、`POST /api/admin/commands/adapters/*`，恢复面消费 `GET /api/admin/audit` 与 `GET /api/admin/config/diff`
- `apps/admin-web/src/shared/realtime/admin-events.ts` 通过 `/ws/admin/events` 同时订阅 `overview` 与 `commands` channel，并把 `snapshot.invalidate` / `command.*` 事件桥接到 shared invalidation / receipt bus；`fills`、`positions`、`accounts`、`risk`、`catalog`、`playback` 与 `diagnostics` surface 依赖同一 invalidation 语义刷新 snapshot
- `nautilus_trader/admin/services/fills.py` 当前把 execution/cache 中已有的 fills 数据投影成 `FillSummary` / `FillsSnapshot`，供浏览器只读消费；它不直接接入交易 venue，也不承担命令执行职责。`nautilus_trader/admin/services/accounts.py` 与 `nautilus_trader/admin/services/risk.py` 同样只负责 account/risk 投影，不直接执行业务控制。`nautilus_trader/admin/services/catalog.py` 与 `nautilus_trader/admin/services/diagnostics.py` 也只负责 catalog/history/playback/diagnostics projection，不直接调度真实回放或修改链路状态。
- `apps/admin-web/src/features/playback/playback-preview-chart.tsx` 是当前唯一引入 `lightweight-charts` 的集成点；图表依赖被局部封装在 playback page，用于渲染 bounded timeline preview，不扩散到其他 admin-web route
- `nautilus_trader/admin/services/config.py` 当前把本机 control-plane guardrail 与 recovery runbook 作为浏览器只读 projection 暴露，不直接接入交易 venue 或远端配置中心
- `Phase 3` close-out integration boundary 当前要求浏览器所有 trading ops / diagnostics workflow 都通过 bounded snapshot / preview DTO 协作；`catalog` / `playback` 的 UTC window、`operator_notes` 与 `errors`，以及 `diagnostics` 的 partial / slow-query feedback 必须跨 HTTP 和 UI 完整透传，不允许依赖隐式超时或 console log 暗示异常

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
