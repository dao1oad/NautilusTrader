# Active Context

## Current Goal

- 在当前独立仓库中基于 `NautilusTrader` 上游源码推进管理 UI 二次开发。

## Current Phase

- UI scope frozen to Phase 0 read-only overview slice; main-agent orchestration is active on issue `#8` / PR Slice A

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
- 2026-03-23 已关闭 GitHub issue `#5`，其规划基线已正式交接给 issue `#8`。
- 2026-03-23 已创建 GitHub issue `#8`：`Phase 0: admin control plane foundation and read-only overview slice`
- 2026-03-23 已为后续阶段创建 umbrella issues：`#9`、`#10`、`#11`、`#12`
- 2026-03-23 已为 `Phase 1-4` 创建子 issues：`#13` 至 `#24`
- 2026-03-23 已修复 `Phase 1-4` issue 正文，使每个 umbrella issue 都承接 phase close-out gate，并为所有 child issue 写明范围、依赖、验收与验证命令
- 2026-03-23 已创建 draft PR `#25`：`docs: finalize admin console phase planning baseline`
- 管理控制台首期开发范围已冻结为：typed backend overview contract + minimal frontend overview shell
- `Phase 0` 当前不包含控制命令、多页面前端、Playwright 和打包发行链路
- `Phase 1-4` 已分别有正式计划文档与 issue 拆解，但当前不提前并行实施
- 2026-03-23 已启动主 agent 围绕 issue `#8` / `PR Slice A` 的任务编排；`#9-#24` 维持 backlog 状态，等待 `#8` 合并后再推进。
- 2026-03-23 已创建并推送 `#8` 的隔离执行分支：`codex/issue-8-phase0-slice-a`，对应本地 worktree `D:\\NautilusTrader\\.worktrees\\issue-8-phase0-slice-a`
- 2026-03-23 已为 `#8` 创建 stacked draft PR `#26`：`feat: scaffold admin api and overview contracts`，当前 base 为 `codex/admin-console-phase-planning-baseline`，待 `#25` 合并后再 retarget 到 `main`
- 2026-03-23 已创建并推送 `#8` 的下一层 stacked 执行分支：`codex/issue-8-phase0-slice-b`，对应本地 worktree `D:\\NautilusTrader\\.worktrees\\issue-8-phase0-slice-b`
- 2026-03-23 已为 `#8` 创建 stacked draft PR `#27`：`feat: add admin overview websocket contract`，当前 base 为 `codex/issue-8-phase0-slice-a`

## Next Actions

1. 围绕 issue `#8` 执行 `PR Slice A`：治理落点 + backend scaffold + health / overview contract。
2. 在 `#26` 与 `#27` 上继续推进 stacked review 流，并在 `#25` 合并后逐层 retarget / merge。
3. 保持 `#9-#24` 为后续阶段 backlog，不提前并行实施。

## Repository

- dao1oad/NautilusTrader
