# Integrations Truth

## GitHub

- 使用 `gh` 同步 issues、审查 reviews、读取 branch protection
- GitHub Actions 负责 `governance-check` 和 `pr-gate`
- 远端 `main` 保护需启用 PR review、required checks、conversation resolution 和 admin enforcement

## Codex

- 主 agent 本地执行
- subagent 云端执行
- review 在远端作为合并门槛

## Current Status

- GitHub CLI 已认证
- 当前仓库尚未绑定 `origin`
- `remote Codex review` 的远端强制状态需在仓库创建后复核
