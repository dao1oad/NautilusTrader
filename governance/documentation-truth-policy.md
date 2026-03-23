# 文档真值治理策略

## 目标

系统文档必须保持单一真值，避免代码行为、系统设计和操作说明发生漂移。

## 规则

- `memory/` 负责运行态记忆，不替代系统真值文档。
- `docs/system-truth/` 负责系统静态真值。
- 绝大多数生产代码改动都必须同步对应的 system-truth 文档。
- `tests/**`、`spec/**`、普通文档目录和 `memory/**` 默认不触发 system-truth 强制校验。
- 未映射的生产代码路径在默认策略下视为失败，不允许静默通过 PR。

## 机器约束

- `ops/doc-truth-registry.yaml` 定义真值角色到文档路径的绑定。
- `ops/doc-truth-map.yaml` 定义代码路径到真值角色的映射。
- `scripts/pre-pr-check.ps1` 在 PR 前检查映射命中、真值文档同步和未映射路径。
