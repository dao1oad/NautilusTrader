# Integrations Truth

## Trading And Data Integrations

- 当前代码树已包含以下 adapter 集成边界：`architect_ax`、`betfair`、`binance`、`bitmex`、`blockchain`、`bybit`、`databento`、`deribit`、`dydx`、`hyperliquid`、`kraken`、`okx`、`polymarket`、`sandbox`、`tardis`
- 集成说明位于 `docs/integrations/`，对应行为验证主要位于 `tests/integration_tests/adapters/`

## Toolchain Integrations

- Rust/Cargo workspace、Cython、PyO3、Poetry build backend、uv lockfile、Docker、Codecov、Codspeed 与 GitHub Actions 共同组成工程工具链
- `.github/workflows/` 已包含构建、覆盖率、Docker、性能、安全审计、文档与 CLI 发布相关自动化

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
