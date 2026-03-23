# Runtime Flows Truth

## Build Flow

`pyproject/build.py 解析环境变量 -> cargo 编译关键 Rust 库 -> Cython/PyO3 扩展构建 -> 可选复制二进制回源码树 -> Python surface 导入编译产物`

## Trading Runtime Flow

`数据源/交易所适配器 -> 规范化 market/order/account 事件 -> common/core/model -> backtest/live/execution -> portfolio/risk/system/trading -> persistence/serialization/报告输出`

## Example And Test Flow

`examples/*` 与 `tests/*` 通过同一 `nautilus_trader` import surface 驱动回测、实盘、适配器和持久化场景，验证 Python 层与 Rust 核心的一致性

## Repository Operational Flow

`GitHub issue -> 主 agent 编排 -> subagent 执行 -> PR -> 远端 Codex review -> review 闭环 -> merge -> memory/system-truth 回写`

## PR Gate Flow

1. 校验 issue 关联
2. 校验 memory 更新
3. 校验 truth-doc 映射与同步
4. 校验远端 review 与线程已解决
5. 校验本地 review 闭环记录

## Security Workflow Flow

1. 面向 `main` 的 PR 会触发 `codeql-analysis`
2. 合并进入 `main` 的 push 会触发 `build.yml`
3. `build.yml` 中的 `cargo-deny` 与 `cargo-vet` 仅在 `refs/heads/main` 上运行，用于覆盖受保护主分支的供应链检查

## PR Review Re-evaluation Flow

1. PR 创建或同步时触发 `pr-gate`
2. 若远端 Codex review 尚未提交，或 review 线程尚未闭环，`pr-gate` 失败并阻止合并
3. 当 Codex connector 提交 review 时，`pull_request_review` 事件再次触发 `pr-gate`
4. 当 Codex connector 以 PR comment 形式返回 `Codex Review` 时，`issue_comment` 事件再次触发 `pr-gate`
5. `pr-gate` 在 `pull_request` 与 `pull_request_review` 重跑时必须 checkout PR head SHA；在 `issue_comment` 重跑时必须 checkout `refs/pull/<number>/head`，避免默认回落到 `main`
6. `pr-gate` 重新读取 review、PR comments、reviewDecision 与 review threads 状态
7. 若 review 线程在失败后被手动 resolve，需要后续 PR 活动、Codex comment 或手动 rerun 来刷新 `pr-gate` 结果
8. 在单维护者模式下，远端 Codex review 已提交或已由 Codex connector comment 明确返回、review 线程已处理且其他门禁满足后，PR 可在无额外人工 Approve 的情况下进入可合并状态

## Truth Rebinding Flow

1. 识别真实代码与自动化路径
2. 更新 `docs/system-truth/` 真值文档
3. 更新 `ops/doc-truth-registry.yaml`
4. 更新 `ops/doc-truth-map.yaml`
5. 若仍存在未映射生产路径，则阻断进入 PR
