# API Contracts Truth

## External Interfaces

- `scripts/init-project.ps1`
  - 输入：`ProjectName`、`Repository`、`SkipRemoteChecks`
  - 契约：校验 `git`、`gh` 和认证状态，写入项目名或仓库信息，输出远端硬化清单
- `scripts/check-governance.ps1`
  - 输入：`SkipRemoteChecks`
  - 契约：校验本地治理文件与 truth-doc 配置；如存在远端则校验 `main` 保护和 required checks
- `scripts/sync-issues.ps1`
  - 输入：`OutputPath`、`Limit`
  - 契约：通过 `gh issue list` 拉取 open issues，并写出标准化快照 JSON
- `scripts/build-workset.ps1`
  - 输入：`InputPath`
  - 契约：消费 issue 快照，生成 `memory/issue-ledger.md` 和 `workspace/issue-packets/*.md`

## Remote Interfaces

- GitHub branch protection 通过 `gh api` 读取与校验
- GitHub Actions 暴露 `governance-check` 与 `pr-gate` 两个 required check
- `pr-gate` workflow 在 `pull_request` 和 `pull_request_review` 事件上运行，以便 PR 变更或 review 提交后重新计算 merge gate
- PR 元数据通过 `.github/PULL_REQUEST_TEMPLATE.md` 和 GitHub 事件负载传递

## Product API Status

- 当前尚未声明业务 API 或服务接口
