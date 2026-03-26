# Active Context

## Current Goal

- 在当前独立仓库中基于 `NautilusTrader` 上游源码推进管理 UI 二次开发。

## Current Phase

- PR `#36` 已并入 `main`，Phase 1B/1C 与本地 PR review 治理迁移已落地。当前仓库正在 2026-03-26 纯本机运行态上继续治理收口：主 agent 在本机 `codex` 会话执行，issue 派发到本机隔离 worktree，`agentboard` 仅作为本机观测面。
- 2026-03-26 已完成 Phase 1 umbrella `#9` 的 close-out merge；当前具体实施入口切换到 issue `#16`，为 Phase 2A 建立 typed command contract、错误码与 append-only audit sink。
- 2026-03-27 issue `#16` 已通过 PR `#38` 合并到 `main`；当前实施入口切换到 issue `#17`，为策略/适配器/订阅控制增加低风险 backend command endpoints 与 WS receipt 事件。

## Blockers

- 无新的人工决策阻塞；当前 issue `#9` 的本地 pre-PR review 已完成，剩余动作是为 umbrella close-out 开 PR 并合并后推进 `#10`。

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
- 2026-03-25 已决定废弃远端 Codex review 作为 merge gate，改为 issue 级本地 PR review 记录；相关 policy、workflow、脚本、模板、truth-doc 与 smoke tests 正在同步迁移。
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
- 2026-03-24 PR `#31` 已合并到 `main`，merge commit 为 `7ed89805c2d330e308595696ef67ce7615f5d210`，open PR 列表当前为空。
- 2026-03-24 已创建独立 worktree `/root/NautilusTrader-phase1a`，分支 `codex/issue-13-phase1a-shell` 跟踪 `origin/main`。
- 2026-03-24 已在 `apps/admin-web` 上完成 `#13` 的 routed console shell、placeholder read-only routes、shared page states、`TanStack Query` overview query 与 WS invalidation bus 实现。
- 2026-03-24 已在 `apps/admin-web` 上验证 `npm test -- --run` 与 `npm run build` 通过；`vite build` 会打印来自 `@tanstack/react-query` 的 `"use client"` 指令忽略警告，但构建结果为成功。
- 2026-03-24 已创建 PR `#32`：`feat: add phase1 admin console shell`，并在 review 驱动下补齐 cached overview refresh error、transient runtime error clearing 与 invalidation 过早清错的修复。
- 2026-03-24 PR `#32` 已合并到 `main`，merge commit 为 `be68412be66640bbb46281c6be7971dc35943f43`。
- 2026-03-24 issue `#13` 已自动关闭；workset 刷新后 open issues 为 15 个，`#14` 已变为 `ready`，`#9` 继续作为 Phase 1 umbrella close-out gate。
- 2026-03-24 PR `#33` 已合并到 `main`，merge commit 为 `30bba2769b0f9874450e87511e7849c8b8389e89`；open PR 列表当前为空，`origin/main` 已同步到该提交。
- 2026-03-24 `main` 上 merge 后 `governance-check` run `23502084044` 已成功；`build` run `23502084064` 再次命中 `cargo-deny` 失败，和前一轮 `23501393959` 的同一仓库级失败一致，暂不视为 `#14` 的新增阻塞。
- 2026-03-24 已创建独立 worktree `/root/NautilusTrader-phase1b`，分支 `codex/issue-14-phase1b-read-only-surfaces` 跟踪 `origin/main`。
- 2026-03-24 已在 `nautilus_trader/admin` 上新增 `nodes`、`strategies`、`adapters` 只读 list snapshot endpoint，并在 `apps/admin-web` 上接通对应 query-backed 页面、shared invalidation 和 truth docs 更新。
- 2026-03-24 已本地验证 `pytest tests/unit_tests/admin -v --confcutdir=tests/unit_tests/admin`、`cd apps/admin-web && npm test -- --run`、`npm run lint`、`npm run build` 全部通过。
- 2026-03-24 已创建 PR `#34`：`feat: add read-only node strategy adapter surfaces`，对应 issue `#14`。
- 2026-03-25 通过将 PR `#34` 暂时转回 draft 再恢复 ready，成功重新触发远端 Codex review；`chatgpt-codex-connector[bot]` comment `4122614161` 确认未发现 major issues。
- 2026-03-25 为修复 GitHub 对同名 cancelled required checks 的错误选取，已重跑 `pull_request` 上下文的 `pr-gate` 与 `governance-check`，以及对应的 `push governance-check`。
- 2026-03-25 PR `#34` 已合并到 `main`，merge commit 为 `c53198d3abd99e6d16fe8fc0601b3835f39686b1`。
- 2026-03-25 issue `#14` 已手动关闭；原因是 PR 正文使用了 `Linked issue: #14` 而非 closing keyword。
- 2026-03-25 已重新同步 open issues；本地 `workspace/runbooks/issues-snapshot.json` 当前为 14 个开放 issue，`#15` 已变为 `ready`，`#9` 继续作为 Phase 1 umbrella close-out gate。
- 2026-03-25 已创建独立 worktree `/root/NautilusTrader-phase1c`，分支 `codex/issue-15-phase1c-read-only-surfaces` 基于 close-loop 分支头 `f0c4200f460cecacc6f9cda307109bae7af7e7ef` 开始实施 `#15`。
- 2026-03-25 已在 `nautilus_trader/admin` 上新增 bounded read-only `orders`、`positions`、`accounts`、`logs` endpoint，并在 `apps/admin-web` 上把 4 个 placeholder route 接成 query-backed 页面，同时把 invalidation fan-out 扩到全部 8 个只读 route topic。
- 2026-03-25 已本地验证 `source .venv/bin/activate && pytest tests/unit_tests/admin -v --confcutdir=tests/unit_tests/admin`、`cd apps/admin-web && npm test -- --run`、`npm run lint`、`npm run build`、`bash scripts/check-governance.sh --skip-remote-checks` 与 `git diff --check` 全部通过。
- 2026-03-25 已创建 PR `#36`：`feat: add read-only trading and logs surfaces`；当前已 retarget 到 `main`，并包含 `#35` 的 Phase 1B close-loop commits 与 `#15` 的 Phase 1C 实现。
- 2026-03-25 已关闭 PR `#35`；原因是其变更已完整包含在 `#36` 中，后者成为唯一面向 `main` 的主线 PR。
- 2026-03-25 PR `#36` 已修复 `nautilus_trader/admin/app.py` 的 Ruff/complexity 失败，并进一步修复 `apps/admin-web/src/features/logs/logs-page.tsx` 被仓库级 `.gitignore` 误忽略导致的远端 `frontend-admin-web` 失败。
- 2026-03-25 新 policy 下，PR `#36` 已补入 `workspace/handoffs/local-review-issue-15.md` 作为本地 PR review 证据，后续只需等待新的 `pr-gate/build` 基于该规则收口。
- 2026-03-26 已将仓库治理运行态切换为纯本机模式：`codex-orchestrator` 由本地主 agent 会话驱动，issue 派发默认落到本机 `.worktrees/`，`agentboard` 运行在本机 `127.0.0.1:8088`，不再依赖远程 worker SSH/DNS 解析。
- 2026-03-26 纯本机运行态新增 `ops/remote-execution.yaml`、`scripts/start-main-agent.ps1`、`scripts/start-local-agentboard.ps1`、`scripts/dispatch-issue.ps1`、`scripts/sync-remote-execution.ps1` 与对应 smoke 覆盖；`AGENTS.md` 也已切换到本机启动路径。
- 2026-03-26 issue `#16` 的隔离 worktree 已补齐 `CommandRequest` / `CommandReceipt` / `CommandFailure` / `AuditRecord` DTO、稳定 `CommandErrorCode` 枚举，以及 `InMemoryAuditSink` append-only 审计服务；`pytest tests/unit_tests/admin/test_commands_schema.py tests/unit_tests/admin/test_audit_service.py -v --confcutdir=tests/unit_tests/admin` 已通过。
- 2026-03-27 issue `#17` 的隔离 worktree 已补齐低风险 command POST route：`strategies/*/start|stop`、`adapters/*/connect|disconnect`、`subscriptions/*/subscribe|unsubscribe`，并让 `/ws/admin/events` 的 `commands` channel 流出 `command.accepted` / `command.completed` receipt 事件；新增后端红测已转绿。

## Next Actions

1. 为 issue `#17` 完成本地 pre-PR review、truth-doc 检查与 PR 提交。
2. issue `#17` 合并后推进 issue `#18`，补齐 command confirmation、audit timeline 与恢复 runbook。
3. 保持 umbrella issue `#10` 只作为 Phase 2 close-out gate，不直接承载功能实现。

## Repository

- dao1oad/NautilusTrader

## Last Merge Update

- 2026-03-26: Rebasing the pure-local runtime migration onto the latest `main` so the local-only governance stack remains the default operating model.

## Last Merge Update

- 2026-03-26: PR #37 merged to main; Phase 1 umbrella close-out complete.
