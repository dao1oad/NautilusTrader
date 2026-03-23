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
