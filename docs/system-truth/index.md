# System Truth Index

## Purpose

本目录维护 `NautilusTrader` 当前仓库的系统静态真值，描述真实存在的结构、边界、契约、数据与运行流程。

## Active Truth Roles

- `architecture` -> `docs/system-truth/architecture.md`
- `module_boundaries` -> `docs/system-truth/module-boundaries.md`
- `api_contracts` -> `docs/system-truth/api-contracts.md`
- `data_model` -> `docs/system-truth/data-model.md`
- `runtime_flows` -> `docs/system-truth/runtime-flows.md`
- `integrations` -> `docs/system-truth/integrations.md`

## Notes

- `memory/` 保存运行态记忆，不作为系统真值替代品。
- 当前仓库仍处于 bootstrap 阶段，truth-doc 主要覆盖治理脚本、GitHub gate 和机器策略。
- 一旦新增 `src/`、`app/`、`lib/`、`services/` 等生产代码路径，必须同步更新 `ops/doc-truth-map.yaml`。
- 新项目可重绑定真值角色到不同路径，但必须更新 `ops/doc-truth-registry.yaml`。
