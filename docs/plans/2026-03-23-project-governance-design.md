# 项目治理框架与记忆系统设计

**日期：** 2026-03-23

## 1. 背景

目标是在当前目录内实现一套可复制的项目启动模板。未来新建项目时，直接复制该目录，即可得到一套完整的项目治理框架和记忆系统，而不是每次从零搭建流程、规则和上下文管理。

该模板默认面向软件开发项目，同时允许通过少量命名调整兼容非开发类项目。模板应将 GitHub issue 驱动、主 agent 调度、subagent 云端执行、PR 合并、远端 Codex review 和项目记忆回写固化为默认且强制的标准路径。

## 2. 设计目标

1. 为新项目提供可直接复用的治理骨架、文档、策略和脚本。
2. 固化主 agent 本地调度、subagent 云端执行的协作模型。
3. 从 GitHub issue 拉取任务，基于依赖和风险做顺序与并发编排。
4. 禁止除项目初始化外的任何改动直接进入远端 `main`。
5. 在 merge 前强制执行远端 Codex review，并要求 review 意见完成闭环。
6. 为主 agent 提供低读取成本、高恢复能力的长期记忆系统。
7. 使用本地脚本和 GitHub 远端保护双层守卫，降低治理腐烂风险。

## 3. 非目标

- 不实现完整的项目管理平台或 Web 控制台。
- 不替代 GitHub 自身的 issue、PR 和 review 能力。
- 不引入数据库或服务端状态存储。
- 不在第一版中覆盖所有本地平台差异。
- 不将全部执行细节永久沉淀到 memory，仅保留高价值上下文。

## 4. 推荐方案

推荐采用“策略文件 + 脚本守卫型”方案。

该方案使用 Markdown 文档定义制度，使用 YAML 文件承载机器可读策略，使用 PowerShell 脚本实现初始化、自检、issue 同步、工作集构建和 merge 后闭环，再通过 GitHub PR 模板、Issue 模板和 Actions 把远端守卫补齐。

与纯文档方案相比，该方案具备更强的可执行性和强约束；与平台化调度方案相比，该方案足够轻量，适合作为每个新项目都能复制的基础盘。

## 5. 总体架构

模板分为四层：

### 5.1 治理层

负责定义项目运行规则，不保存运行状态。

核心内容：

- agent 角色与职责
- issue 编排规则
- 分支策略
- PR 和 review 门槛
- Definition of Ready / Definition of Done
- 风险升级机制

### 5.2 记忆层

负责承载项目长期上下文，使任意一次新会话都能低成本接管项目。

核心内容：

- 当前阶段与下一步
- 项目目标与边界
- 仓库地图
- 决策记录
- 约束与风险
- issue 编排账本

### 5.3 执行层

负责将 GitHub issue 转换为主 agent 可执行的工作集，并生成 subagent 可消费的任务包。

核心内容：

- issue 同步
- issue 标准化
- 依赖排序
- 并发编排
- issue packet 生成
- PR 前后闭环脚本

### 5.4 守卫层

负责阻止违规流程进入远端 `main`。

核心内容：

- 本地初始化检查
- 本地治理文件检查
- PR 前检查
- GitHub Actions gate
- branch protection 校验
- review 闭环校验

## 6. 目录结构

建议使用如下固定结构：

```text
/
|-- AGENTS.md
|-- README.md
|-- PROJECT_INIT.md
|-- .gitignore
|-- .editorconfig
|-- .github/
|   |-- ISSUE_TEMPLATE/
|   |-- PULL_REQUEST_TEMPLATE.md
|   `-- workflows/
|-- governance/
|   |-- charter.md
|   |-- operating-model.md
|   |-- branch-policy.md
|   |-- issue-orchestration.md
|   |-- pr-review-policy.md
|   |-- definition-of-ready.md
|   |-- definition-of-done.md
|   |-- risk-escalation.md
|   |-- conventions/
|   `-- templates/
|-- memory/
|   |-- active-context.md
|   |-- product-context.md
|   |-- repo-map.md
|   |-- decision-log.md
|   |-- progress-log.md
|   |-- issue-ledger.md
|   |-- glossary.md
|   |-- known-constraints.md
|   `-- retrospectives/
|-- ops/
|   |-- project-policy.yaml
|   |-- agent-config.yaml
|   |-- issue-board.yaml
|   |-- review-gates.yaml
|   `-- bootstrap-checklist.md
|-- scripts/
|   |-- init-project.ps1
|   |-- check-governance.ps1
|   |-- sync-issues.ps1
|   |-- build-workset.ps1
|   |-- pre-pr-check.ps1
|   `-- close-loop.ps1
|-- docs/
|   |-- plans/
|   |-- architecture/
|   `-- reports/
`-- workspace/
    |-- issue-packets/
    |-- runbooks/
    `-- handoffs/
```

## 7. Agent 协作模型

### 7.1 主 agent

- 执行位置：本地
- 默认模型：`gpt-5.4`
- 默认思考强度：`xhigh`

职责：

- 从 GitHub 拉取开放 issue
- 结合 `memory/` 和 `ops/` 进行依赖和并发编排
- 生成 issue packet
- 派发给云端 subagent
- 汇总结果并推动 PR、review、merge 和记忆回写

### 7.2 subagent

- 执行位置：Codex 云端
- 默认模型：`gpt-5.4`
- 默认思考强度：`xhigh`

职责：

- 接收单个 issue 或单个明确子任务
- 在边界清晰的上下文中完成实现或分析
- 返回改动摘要、测试结果、风险点和待决策项

### 7.3 review agent

- 执行位置：远端 Codex review
- 作用阶段：PR merge 前

职责：

- 对 PR 做远端审查
- 输出结构化 review 意见
- 作为 merge 前硬门槛之一

## 8. Issue 驱动工作流

标准闭环如下：

`GitHub issue -> 主 agent 编排 -> subagent 执行 -> PR -> 远端 Codex review -> 处理意见 -> merge -> 回写 memory -> 下一轮编排`

建议的 issue 状态机：

```text
discovered
-> normalized
-> needs-clarification | blocked | ready
-> dispatched
-> in-progress
-> awaiting-pr
-> awaiting-remote-review
-> changes-requested | approved
-> ready-to-merge
-> merged
-> archived
```

并发只允许发生在以下前提同时成立时：

- 无依赖关系
- 无共享核心写集
- 不改同一治理或共享状态核心文件
- 不跨同一发布风险域

## 9. PR 与远端保护

模板必须显式承认一个现实约束：仅靠仓库内文件无法单独强制远端 `main` 保护和远端 Codex review。真正的强制依赖 GitHub 仓库设置和 required checks。

因此模板需要同时提供：

- 制度定义
- 初始化硬化脚本
- 持续校验脚本
- PR gate workflow

强制规则如下：

1. 除初始化外，所有变更只能通过 PR 合并到远端 `main`
2. merge 前必须完成远端 Codex review
3. review 意见必须被处理、接受或带理由驳回
4. 缺失 branch protection 或 required checks 时视为治理失败

## 10. 记忆系统设计

记忆系统分为四层：

### 10.1 核心记忆

主 agent 每次启动必须读取：

- `memory/active-context.md`
- `memory/product-context.md`
- `memory/repo-map.md`
- `memory/issue-ledger.md`
- `ops/project-policy.yaml`
- `ops/agent-config.yaml`

### 10.2 决策记忆

保存为什么这么做：

- `memory/decision-log.md`
- `memory/known-constraints.md`
- `docs/architecture/`

### 10.3 执行记忆

保存推进痕迹和交接信息：

- `memory/progress-log.md`
- `workspace/issue-packets/`
- `workspace/handoffs/`
- `docs/reports/`

### 10.4 复盘记忆

保存可复用的经验、事故复盘和问题模式：

- `memory/retrospectives/`
- `docs/reports/postmortem-*.md`

## 11. 记忆更新原则

1. 主 agent 对 `active-context.md`、`issue-ledger.md`、`progress-log.md` 负责。
2. 架构或关键流程变化必须更新 `decision-log.md`。
3. 仓库结构变化必须更新 `repo-map.md`。
4. merge 后必须回写 memory，而不是只合并代码。
5. PR 模板和本地脚本需检查 memory 是否已按规则更新。

## 12. 初始化完成定义

只有同时满足以下条件，项目才算完成启动：

- 治理文档已就位
- 记忆系统已就位
- 策略文件已配置
- GitHub 仓库已绑定
- `main` 保护已开启
- required checks 已生效
- 远端 review gate 已纳入 merge 条件
- 首轮 issue 已同步并形成本地编排账本

## 13. 成功标准

1. 新项目可在 30 分钟内完成初始化并进入可执行状态。
2. 主 agent 能通过核心记忆文件恢复项目状态。
3. GitHub issue 可被转化为本地编排账本和 issue packet。
4. 主 agent 可正确区分串行、可并发、阻塞和待澄清任务。
5. 非初始化变更无法绕过 PR 直接进入远端 `main`。
6. 每个 PR merge 前都必须经过远端 Codex review。
7. 每条 review 意见都有闭环记录。
8. merge 后 memory 会得到同步更新。

## 14. 风险与假设

- 第一版默认以 Windows 本地环境和 PowerShell 脚本为主。
- GitHub 远端保护和远端 Codex review 的最终强制能力取决于目标仓库权限与平台集成能力。
- 模板仓库内的治理文件和脚本负责定义规则、发现偏差和阻断违规流程，但不替代远端仓库权限控制。

## 15. 后续实施方向

按以下优先顺序实施：

1. 目录骨架与基础文档
2. 治理文档与记忆模板
3. 策略文件
4. 初始化与检查脚本
5. issue 同步与工作集脚本
6. PR 前检查与 merge 后闭环脚本
7. GitHub 模板与 workflow
8. 自检与启动演练
