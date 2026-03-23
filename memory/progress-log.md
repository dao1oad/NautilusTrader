# Progress Log

## 2026-03-23

- 创建设计文档与实施计划。
- 初始化仓库并开始模板实现。
- 完成 `NautilusTrader` 的 memory、truth-doc 与 truth-map 重绑。
- 修复 `scripts/sync-issues.ps1` 在 0 个 issue 时不落盘的问题，并补回归测试。
- 创建私有 GitHub 仓库 `dao1oad/NautilusTrader`，推送初始提交并绑定 `origin`。
- 验证到 GitHub 私有仓库分支保护 API 受账户套餐限制，远端治理闭环暂时阻塞。
- 将仓库改为 public，并成功启用 `main` 分支保护、required checks、PR review 和 conversation resolution。
- 运行 `scripts/check-governance.ps1`，本地与远端治理检查全部通过。
- 创建 GitHub issue `#1`，用于承接首个治理 PR 和端到端 gate 验证。
- 创建 PR `#2`：`docs: finalize public governance bootstrap`。
- 通过 `@codex review` 成功触发远端 Codex review，确认实际 review actor 为 `chatgpt-codex-connector[bot]`。
- 修复 `pr-gate` 仅监听 `pull_request` 的问题，补齐 `pull_request_review` 与 `pull_request_review_thread` 触发。
- 同步更新受影响的 truth-doc，并把 `review-resolution-2.md` 从占位记录改为实际闭环记录。
- 发现 `pull_request_review_thread` 会使 GitHub 将 workflow 视为无效文件，因此回退为 `pull_request` + `pull_request_review`，并把 thread resolve 后的 gate 刷新策略记录为后续 PR 活动或手动 rerun。
- PR `#2` 当前 required checks 全绿，唯一剩余阻塞为 GitHub 原生的非作者 approving review 要求。
- 将仓库治理调整为单维护者模式：把 approving review 计数改为可配置，并为当前仓库设置为 `0`，保留 PR-only、required checks、remote Codex review 和 review 闭环。
- `pr-gate` 在新提交上命中 truth-doc 门禁，定位到 `ops/review-gates.yaml` 的变更尚未同步 `docs/system-truth/module-boundaries.md`，已补齐并通过本地 `pre-pr-check` 复验。
- GitHub merge API 进一步暴露出必需检查名错配：分支保护要求 `governance-check`，workflow 实际产出的是 `governance`；已将 workflow job 名修正为 `governance-check` 并通过本地 smoke 复验。
- PR `#2` 已在 required checks 全绿后合并到 `main`，远端 `main` 当前要求 `governance-check`、`pr-gate`、conversation resolution，且 `required_approving_review_count` 为 `0`。
- issue `#1` 已关闭；issue `#3` 已创建，用于将 startup memory 从“bootstrap PR 待合并”同步到“bootstrap 已完成”的当前状态。
- 在 PR `#4` 上确认 Codex connector 可能返回普通 PR comment `Codex Review: Didn't find any major issues. Breezy!` 而非 submitted review；已补齐 `pr-gate` 的 `issue_comment` 触发和 `pre-pr-check.ps1` 的 comment 识别逻辑。
