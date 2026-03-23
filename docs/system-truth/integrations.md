# Integrations Truth

## Trading And Data Integrations

- 当前代码树已包含以下 adapter 集成边界：`architect_ax`、`betfair`、`binance`、`bitmex`、`blockchain`、`bybit`、`databento`、`deribit`、`dydx`、`hyperliquid`、`kraken`、`okx`、`polymarket`、`sandbox`、`tardis`
- 集成说明位于 `docs/integrations/`，对应行为验证主要位于 `tests/integration_tests/adapters/`

## Toolchain Integrations

- Rust/Cargo workspace、Cython、PyO3、Poetry build backend、uv lockfile、Docker、Codecov、Codspeed 与 GitHub Actions 共同组成工程工具链
- `.github/workflows/` 已包含构建、覆盖率、Docker、性能、安全审计、文档与 CLI 发布相关自动化

## Repository Governance Integrations

- 使用 `gh` 同步 issues、审查 reviews、读取 branch protection
- GitHub Actions 继续负责 `governance-check` 和 `pr-gate`
- 远端 `main` 保护需启用 PR review、required checks、conversation resolution 和 admin enforcement
- `pr-gate` 会在 PR 更新、review 提交和 PR issue comment 创建后重跑；review 线程 resolve 后若需刷新 gate，依赖后续 PR 活动、Codex comment 或手动 rerun
- 主 agent 本地执行，subagent 云端执行，review 仍以远端 Codex review 为合并门槛

## Current Status

- GitHub CLI 已认证
- 当前仓库已绑定自己的 `origin`：`dao1oad/NautilusTrader`
- 当前仓库未保留 `nautechsystems/nautilus_trader` 作为 remote
