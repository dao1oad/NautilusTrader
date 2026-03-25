# Decision Log

## 2026-03-23

### Context

需要一套可复制的项目治理与记忆模板。

### Decision

采用“策略文件 + 脚本守卫型”方案。

### Impact

治理规则由 Markdown 定义，脚本与 workflow 负责执行与阻断。

## 2026-03-23

### Context

`NautilusTrader` 需要保持 private，同时默认要求 `main only via pull request` 与远端 review 门禁。

### Decision

先创建 private GitHub 仓库并保留全部本地治理门禁；将远端分支保护配置失败明确记录为平台能力阻塞，而不是降低默认治理开关。

### Impact

仓库已具备本地可执行治理基线，但远端强制门禁仍依赖 GitHub Pro、支持私有分支保护的组织，或改为 public 仓库。

## 2026-03-23

### Context

用户确认将 `dao1oad/NautilusTrader` 改为 public，以换取可用的 GitHub 分支保护能力。

### Decision

将仓库从 private 改为 public，并在远端启用 `main` 分支保护、required checks、PR review 和 conversation resolution。

### Impact

默认治理要求已经在 GitHub 侧生效，仓库进入可执行、可治理、可记忆状态。

## 2026-03-23

### Context

仓库只有 1 个 GitHub 账号可用，但仍要求保留 `main only via pull request`、required checks、remote Codex review 和 review 闭环。

### Decision

将远端 `required_approving_review_count` 调整为 `0`，采用单维护者模式；同时保留远端 Codex review 作为 merge 前必需 gate。

### Impact

仓库不再依赖第二个 GitHub 账号手工 Approve，但治理强度仍由 PR-only、required checks、remote review 和 review-resolution 记录维持。

## 2026-03-23

### Context

远端分支保护要求的 status check 名称必须与 GitHub Actions 实际产出的 check context 完全一致。

### Decision

将 `.github/workflows/governance-check.yml` 的 job 名统一为 `governance-check`，与分支保护和 `ops/review-gates.yaml` 保持一致。

### Impact

GitHub merge API 不再因 `Required status check "governance-check" is expected` 拒绝合并，治理配置与执行结果保持同名闭环。

## 2026-03-23

### Context

Codex connector 在无问题场景下可能只留下 `Codex Review` PR comment，而不创建 submitted review；原有 gate 只识别 `pulls/{number}/reviews`，会误判为缺少远端 review。

### Decision

将 `pr-gate` 扩展到 PR `issue_comment` 事件，并让 `scripts/pre-pr-check.ps1` 同时接受 Codex connector 的 submitted review 与 `Codex Review` comment 作为远端 review 信号。

### Impact

远端 Codex review 的“有意见 review”与“无意见 comment”两种真实返回形态都能驱动 gate 正确重评，避免 comment-only 场景把 PR 错误阻塞在 merge 前。

## 2026-03-25

### Context

远端 Codex review connector 已长期只返回 usage-limit comment，当前仓库无法再把云端 review 当作稳定可用的 merge gate，但仍需要保留强制 review 证据与闭环。

### Decision

废弃 `remote Codex review` 作为自动化门禁，改为强制的 issue 级本地 PR review：在 PR 创建前生成并提交 `workspace/handoffs/local-review-issue-<issue>.md`，由 `pr-gate` 校验其存在性、字段完整性和 `approved` 状态。

### Impact

仓库继续维持 `main only via pull request`、required checks、memory/truth-doc 门禁和 review 闭环，但不再依赖受配额影响的远端 connector 才能合并主线 PR。
