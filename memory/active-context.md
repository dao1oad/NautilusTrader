# Active Context

## Current Goal

- 在当前独立仓库中基于 `NautilusTrader` 上游源码推进管理 UI 二次开发。

## Current Phase

- Upstream source synced; ready for UI architecture and scoped implementation work

## Blockers

- 无

## Confirmed Facts

- 当前 Git 仓库已完成初始化提交。
- bootstrap 治理基线已于 2026-03-23 通过 PR `#2` 合并到 `main`。
- GitHub CLI 已认证，可执行远端查询与后续绑定。
- 2026-03-23 已通过 GitHub codeload zip 导入 `nautechsystems/nautilus_trader` 的 `master` 源码快照。
- 当前仓库已包含上游主要生产代码路径：`crates/`、`nautilus_trader/`、`python/`、`schema/`、`examples/`、`tests/`。
- `scripts/init-project.ps1` 已运行通过。
- `scripts/check-governance.ps1` 已运行通过，含远端保护检查。
- `tests/smoke/run-all.ps1` 已运行通过。
- GitHub 仓库 `dao1oad/NautilusTrader` 已创建并改为公开仓库。
- `origin` 已绑定到 `ssh://git@ssh.github.com:443/dao1oad/NautilusTrader.git`。
- 远端 `main` 已启用分支保护、required checks、PR review 和 conversation resolution。
- 远端 required checks 当前为 `governance-check` 与 `pr-gate`。
- 当前仓库只有 1 个 GitHub 账号可用于维护，远端 `required_approving_review_count` 已调整为 `0`。
- 远端 Codex review 当前可通过 submitted review 或 `Codex Review` PR comment 体现，`pr-gate` 已支持两种信号。
- 当前仓库未保留上游 `nautechsystems/nautilus_trader` 的 Git remote 或提交历史。

## Next Actions

1. 明确管理 UI 应落在现有仓库的哪个技术平面中。
2. 为管理 UI 创建首个真实工作 issue，并写回 `memory/issue-ledger.md`。
3. 基于新的生产路径继续使用 `issue -> PR -> remote Codex review -> review 闭环 -> merge` 的默认推进方式。

## Repository

- dao1oad/NautilusTrader
