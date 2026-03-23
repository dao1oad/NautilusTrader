# Active Context

## Current Goal

- 保持当前 `NautilusTrader` 仓库处于可执行、可治理、可记忆的 ready 状态，并为首个真实项目 issue 提供干净基线。

## Current Phase

- Bootstrap complete; ready for first scoped project work

## Blockers

- 无

## Confirmed Facts

- 当前 Git 仓库已完成初始化提交。
- bootstrap 治理基线已于 2026-03-23 通过 PR `#2` 合并到 `main`。
- GitHub CLI 已认证，可执行远端查询与后续绑定。
- 当前仓库仅有治理模板骨架，未发现业务代码目录。
- `scripts/init-project.ps1` 已运行通过。
- `scripts/check-governance.ps1` 已运行通过，含远端保护检查。
- `tests/smoke/run-all.ps1` 已运行通过。
- GitHub 仓库 `dao1oad/NautilusTrader` 已创建并改为公开仓库。
- `origin` 已绑定到 `ssh://git@ssh.github.com:443/dao1oad/NautilusTrader.git`。
- 远端 `main` 已启用分支保护、required checks、PR review 和 conversation resolution。
- 远端 required checks 当前为 `governance-check` 与 `pr-gate`。
- 当前仓库只有 1 个 GitHub 账号可用于维护，远端 `required_approving_review_count` 已调整为 `0`。
- issue `#1` 已关闭，bootstrap 收尾改由 issue `#3` 负责同步 memory 到 post-bootstrap 完成态。

## Next Actions

1. 为实际项目目标创建首个真实工作 issue，并写回 `memory/issue-ledger.md`。
2. 若引入 `src/`、`app/`、`lib/`、`services/` 等生产路径，先同步 `ops/doc-truth-map.yaml` 与 `docs/system-truth/`。
3. 继续使用 `issue -> PR -> remote Codex review -> review 闭环 -> merge` 的默认推进方式。

## Repository

- dao1oad/NautilusTrader
