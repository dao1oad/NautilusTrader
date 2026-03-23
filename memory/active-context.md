# Active Context

## Current Goal

- 将当前 `NautilusTrader` 仓库绑定为可执行、可治理、可记忆的项目基线。

## Current Phase

- Remote binding and hardening

## Blockers

- GitHub 私有仓库当前无法通过分支保护 API 启用 `main` 保护，GitHub 返回 `403 Upgrade to GitHub Pro or make this repository public to enable this feature`。
- 因远端分支保护无法启用，`main only via pull request`、required checks 和远端 review 门槛暂时不能在 GitHub 侧强制生效。
- `remote Codex review` 的 actor 级强制仍需在首个 PR 上验证。

## Confirmed Facts

- 当前 Git 仓库已完成初始化提交。
- 当前分支为 `main`。
- GitHub CLI 已认证，可执行远端查询与后续绑定。
- 当前仓库仅有治理模板骨架，未发现业务代码目录。
- `scripts/init-project.ps1` 已运行通过。
- `scripts/check-governance.ps1 -SkipRemoteChecks` 已运行通过。
- `tests/smoke/run-all.ps1` 已运行通过。
- GitHub 仓库 `dao1oad/NautilusTrader` 已创建为私有仓库。
- `origin` 已绑定到 `ssh://git@ssh.github.com:443/dao1oad/NautilusTrader.git`。

## Next Actions

1. 若坚持私有仓库，升级 GitHub 计划或迁移到支持私有分支保护的组织。
2. 启用 `main` 分支保护、required checks 和 review 门槛。
3. 运行不带 `-SkipRemoteChecks` 的 `scripts/check-governance.ps1`。
4. 在首个 PR 上验证 `remote Codex review` actor 与 review 闭环记录。
5. 绑定远端后持续执行 `scripts/sync-issues.ps1` 进入 issue 编排闭环。

## Repository

- dao1oad/NautilusTrader
