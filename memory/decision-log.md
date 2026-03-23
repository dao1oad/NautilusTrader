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
