# Active Context

## Current Goal

- 将当前 `NautilusTrader` 仓库绑定为可执行、可治理、可记忆的项目基线。

## Current Phase

- Bootstrap binding

## Blockers

- GitHub 同名仓库尚未创建，`origin` 未绑定。
- 远端仓库可见性未明确，不适合直接猜测创建为 `public` 或 `private`。
- `remote Codex review` 的远端集成状态需在仓库创建后校验。

## Confirmed Facts

- 当前 Git 仓库尚无提交。
- 当前分支为 `codex/project-governance-template`。
- GitHub CLI 已认证，可执行远端查询与后续绑定。
- 当前仓库仅有治理模板骨架，未发现业务代码目录。
- `scripts/init-project.ps1` 已运行通过。
- `scripts/check-governance.ps1 -SkipRemoteChecks` 已运行通过。
- `tests/smoke/run-all.ps1` 已运行通过。

## Next Actions

1. 确认 `dao1oad/NautilusTrader` 的仓库可见性。
2. 创建 GitHub 同名仓库并绑定 `origin`。
3. 配置 `main` 保护、required checks 和 review 门槛。
4. 运行不带 `-SkipRemoteChecks` 的 `scripts/check-governance.ps1`。
5. 绑定远端后执行 `scripts/sync-issues.ps1` 进入 issue 编排闭环。
