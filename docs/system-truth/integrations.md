# Integrations Truth

## Trading And Data Integrations

- 当前代码树已包含以下 adapter 集成边界：`architect_ax`、`betfair`、`binance`、`bitmex`、`blockchain`、`bybit`、`databento`、`deribit`、`dydx`、`hyperliquid`、`kraken`、`okx`、`polymarket`、`sandbox`、`tardis`
- 集成说明位于 `docs/integrations/`，对应行为验证主要位于 `tests/integration_tests/adapters/`

## Admin Control Plane Integration

- `Phase 0` 的前后端集成是本机 `localhost` 开发态双进程：
  - `apps/admin-web` 通过 `Vite` dev server 提供浏览器入口
  - `nautilus_trader/admin` 提供 admin REST / WebSocket contract
- 浏览器与后端的集成边界固定在 admin DTO 与最小事件契约；前端不得直接读取 `live`、`execution`、`portfolio`、`risk`、`persistence` 内部对象
- `Phase 0` 只承诺开发态集成，不把静态资源托管、wheel 打包、桌面壳、Playwright、多用户或远程部署视为已进入当前集成范围

## Toolchain Integrations

- Rust/Cargo workspace、Cython、PyO3、Poetry build backend、uv lockfile、Docker、Codecov、Codspeed 与 GitHub Actions 共同组成工程工具链
- `.github/workflows/` 已包含构建、覆盖率、Docker、性能、安全审计、文档与 CLI 发布相关自动化

## Repository Governance Integrations

- 使用 `gh` 同步 issues、审查 reviews、读取 branch protection
- GitHub Actions 继续负责 `governance-check` 和 `pr-gate`
- `build.yml` 与 `codeql-analysis.yml` 需要对齐受保护分支 `main`；CodeQL 覆盖面向 `main` 的 PR，供应链检查覆盖 push 到 `main`
- 远端 `main` 保护需启用 PR review、required checks、conversation resolution 和 admin enforcement
- `pr-gate` 会在 PR 更新、review 提交和 PR issue comment 创建后重跑；其中 review/comment 触发的重跑必须显式 checkout 目标 PR head，review 线程 resolve 后若需刷新 gate，依赖后续 PR 活动、Codex comment 或手动 rerun

## Codex

- 主 agent 本地执行
- subagent 云端执行
- review 在远端作为合并门槛，可表现为 submitted review 或 `Codex Review` PR comment

## Current Status

- GitHub CLI 已认证
- 当前仓库已绑定自己的 `origin`：`dao1oad/NautilusTrader`
- 当前仓库未保留 `nautechsystems/nautilus_trader` 作为 remote
