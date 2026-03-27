# 新项目治理框架启动 Prompt

将下面整段内容粘贴给 Codex 或其他兼容 agent，用于在**复制当前模板目录**后的新项目中完成治理框架搭建和初始化。

English anchors for tooling:

- `copy the template directory`
- `minimal confirmation list`

```text
你现在位于一个刚复制完成的项目启动模板目录中。请在当前仓库内完成项目治理框架初始化与绑定，目标是让该项目立即进入“可执行、可治理、可记忆”的状态。

执行模式使用“混合型”：
- 能可靠推断的内容，直接落地
- 高风险或无法可靠推断的内容，不要猜，输出最小待确认清单

必须遵守以下要求：
- 默认开启治理
- 默认开启 truth-doc 文档真值门禁
- 默认保持 `main only via pull request`
- 默认要求开 PR 前完成 `local pre-PR review`
- 默认启用本机 `codex-orchestrator + agentboard`
- 默认要求 review 闭环记录

请按下面顺序执行：

1. 读取并理解以下文件：
- `AGENTS.md`
- `README.md`
- `PROJECT_INIT.md`
- `ops/project-policy.yaml`
- `ops/doc-truth-registry.yaml`
- `ops/doc-truth-map.yaml`
- `memory/active-context.md`
- `docs/system-truth/index.md`

2. 探查当前项目真实结构：
- Git 仓库状态
- GitHub 远端配置
- 代码目录
- 测试目录
- 现有文档目录
- 是否已有 `src/`、`app/`、`lib/`、`services/`、`tests/`、`docs/` 等结构

3. 直接完成以下初始化动作：
- 更新 `memory/product-context.md`
- 更新 `memory/repo-map.md`
- 更新 `memory/active-context.md`
- 更新 `docs/system-truth/index.md`
- 按当前项目实际结构重绑定 `ops/doc-truth-registry.yaml`
- 按当前项目实际代码布局重绑定 `ops/doc-truth-map.yaml`
- 如有必要，补充或改写 `docs/system-truth/` 下的真值文档

4. 运行初始化与治理检查：
- `scripts/init-project.ps1`
- `scripts/check-governance.ps1`
- `scripts/init-project.sh`
- `scripts/check-governance.sh`

5. 如果仓库已连接 GitHub，则检查并报告这些远端要求是否已满足：
- 分支保护
- required checks
- 仅通过 PR 合并到 `main`
- conversation resolution

6. 最终输出必须包含：
- 已自动完成的初始化项
- 需要人工确认的最小待确认清单
- minimal confirmation list
- 当前 truth-doc 绑定结果
- 当前 issue 编排入口是否可用
- 当前本机执行入口是否可用
- 下一步建议命令或动作

额外约束：
- 不要把 `memory/` 当作系统静态真值替代物
- `doc-truth-registry.yaml` 负责“真值角色 -> 文档路径”
- `doc-truth-map.yaml` 负责“代码路径 -> 真值角色”
- 如果发现生产代码路径未映射，且无法安全推断，请明确列入最小待确认清单
- 除非必要，不要关闭任何默认治理开关
```

## 使用方式

1. 复制当前模板目录到新项目目录。
2. 打开新项目目录。
3. 将上面的 prompt 整段粘贴给 agent。
4. 让 agent 完成自动初始化，再处理它返回的最小待确认清单。
