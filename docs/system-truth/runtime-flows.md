# Runtime Flows Truth

## Bootstrap Flow

`复制模板 -> 重绑 memory/system-truth -> 运行 init-project -> 运行 check-governance -> 创建 GitHub 仓库 -> 配置 main 保护 -> 启动 issue 编排`

## Primary Operational Flow

`GitHub issue -> 主 agent 编排 -> subagent 执行 -> PR -> 远端 Codex review -> review 闭环 -> merge -> memory/system-truth 回写`

## PR Gate Flow

1. 校验 issue 关联
2. 校验 memory 更新
3. 校验 truth-doc 映射与同步
4. 校验远端 review 与线程已解决
5. 校验本地 review 闭环记录

## PR Review Re-evaluation Flow

1. PR 创建或同步时触发 `pr-gate`
2. 若远端 review 尚未批准，`pr-gate` 失败并阻止合并
3. 当 Codex connector 提交 review 时，`pull_request_review` 事件再次触发 `pr-gate`
4. 当 review 线程被 resolve 时，`pull_request_review_thread` 事件再次触发 `pr-gate`
5. `pr-gate` 重新读取 review 事件、reviewDecision 与 review threads 状态
6. 只有远端 Codex review 已提交、review 线程已处理且其他门禁满足时，PR 才进入可合并状态

## Truth Rebinding Flow

1. 识别真实代码与自动化路径
2. 更新 `docs/system-truth/` 真值文档
3. 更新 `ops/doc-truth-registry.yaml`
4. 更新 `ops/doc-truth-map.yaml`
5. 若仍存在未映射生产路径，则阻断进入 PR
