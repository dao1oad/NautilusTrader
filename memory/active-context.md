# Active Context

## Current Goal

- 在当前独立仓库中基于 `NautilusTrader` 上游源码推进管理 UI 二次开发。

## Current Phase

- Phase 0 read-only overview slice 已通过 PR `#30` 合并到 `main`；当前进入 Phase 1 启动前的 post-merge close-loop，并已恢复 `#13` 作为下一个具体可执行入口

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
- 2026-03-23 已创建并推送 `#8` 的下一层 stacked 执行分支：`codex/issue-8-phase0-slice-c`，对应本地 worktree `D:\\NautilusTrader\\.worktrees\\issue-8-phase0-slice-c`
- 2026-03-23 已为 `#8` 创建 stacked draft PR `#28`：`feat: scaffold admin web overview shell`，当前 base 为 `codex/issue-8-phase0-slice-b`
- 2026-03-23 已创建并推送 `#8` 的下一层 stacked 执行分支：`codex/issue-8-phase0-slice-d`，对应本地 worktree `D:\\NautilusTrader\\.worktrees\\issue-8-phase0-slice-d`
- 2026-03-23 已为 `#8` 创建 stacked draft PR `#29`：`feat: finalize phase 0 admin overview integration`，当前 base 为 `codex/issue-8-phase0-slice-c`
- 2026-03-24 已创建 Linux 集成 worktree `/root/NautilusTrader-phase0`，分支 `codex/phase0-integration` 跟踪 `origin/codex/issue-8-phase0-slice-d`
- 2026-03-24 已在 Linux 上验证 `apps/admin-web` 的 `npm ci`、`npm test -- --run`、`npm run build` 全部通过
- 2026-03-24 已在 Linux 上验证 `tests/unit_tests/admin` 全部通过
- 2026-03-24 已在 Linux 上验证 `bash scripts/check-governance.sh --skip-remote-checks`、`bash scripts/check-governance.sh`、`bash scripts/build-workset.sh` 与 `pwsh -File tests/smoke/run-all.ps1` 全部通过
- 2026-03-24 已确认 `scripts/build-workset.ps1` / `scripts/build-workset.sh` 会保留 issue-ledger 中活跃 issue 的非默认 PR/next 元数据，避免 workset 刷新时抹掉执行态记忆
- 2026-03-24 已确认远端 issue `#8` 仍为 `OPEN`，范围维持 `Phase 0`：typed admin API + minimal overview frontend + minimal WS invalidation semantics
- 2026-03-24 已确认 draft PR `#26`、`#27`、`#28`、`#29` 仍为 open，当前都只有 `governance-check` 成功记录，尚未进入 review 决策阶段
- 2026-03-24 已确认 draft PR `#25` 是当前 stacked 链的前置阻塞；其 `pr-gate` 与 `pre-commit` 仍失败，未进入可 retarget / merge 状态
- 2026-03-24 已决定不再以 `#25-#29` 作为 Phase 0 的主合并路径，而是把 Linux 上已验证的 `codex/phase0-integration` 收口为一个直达 `main` 的新 PR
- 2026-03-24 已在 Linux 上完成 `uvx --from pre-commit pre-commit run --all-files`、`bash scripts/check-governance.sh`、`pwsh -File tests/smoke/run-all.ps1`、`pytest tests/unit_tests/admin -v --confcutdir=tests/unit_tests/admin`、`apps/admin-web` lint/test/build 的验证；当前仅剩全量 `uv run --active --no-sync build.py` 与导入验证收尾
- 2026-03-24 已完成全量 `uv run --active --no-sync build.py` 与 `import nautilus_trader` 导入验证
- 2026-03-24 已创建直达 `main` 的 PR `#30`：`fix: finalize linux governance and phase0 mainline`
- 2026-03-24 PR `#30` 已合并到 `main`，GitHub issue `#8` 已自动关闭。
- 2026-03-24 旧的 stacked draft PR 链 `#25`-`#29` 已全部关闭，并统一标记为被 `#30` 取代。
- 2026-03-24 已重新同步 open issues，本地 `workspace/runbooks/issues-snapshot.json` 当前为 16 个开放 issue。
- 2026-03-24 已修正 `scripts/build-workset.ps1` / `scripts/build-workset.sh` 的依赖提取逻辑：仅 `Depends on` 段会进入执行依赖；`Parent` 与 `Child issues` 仅保留为编排说明，不再制造虚假循环阻塞。
- 2026-03-24 在新 workset 下，umbrella issue `#9` 与具体执行 issue `#13` 均已恢复为 `ready`；其中 `#13` 是更合适的下一个实施入口。

## Next Actions

1. 以 issue `#13` 作为 Phase 1A 的具体执行入口，启动 console shell / routing / shared page state 的实现分支。
2. 将 issue `#9` 保持为 Phase 1 umbrella close-out gate，而不是直接承载功能实现。
3. 继续沿用 `issue -> PR -> remote Codex review -> merge -> close-loop` 的默认推进路径。

## Repository

- dao1oad/NautilusTrader

## Last Merge Update

- 2026-03-24: Merged PR #30 to main and closed Phase 0 issue #8.
