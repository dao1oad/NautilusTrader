# System Truth Index

## Purpose

本目录维护当前 `NautilusTrader` 独立仓库的系统静态真值，描述真实存在的代码结构、模块边界、契约、数据与运行流程。

## Active Truth Roles

- `architecture` -> `docs/system-truth/architecture.md`
- `module_boundaries` -> `docs/system-truth/module-boundaries.md`
- `api_contracts` -> `docs/system-truth/api-contracts.md`
- `data_model` -> `docs/system-truth/data-model.md`
- `runtime_flows` -> `docs/system-truth/runtime-flows.md`
- `integrations` -> `docs/system-truth/integrations.md`

## Notes

- 当前生产代码主路径包括 `crates/`、`nautilus_trader/`、`python/`、`schema/`、`examples/`、`scripts/`、`.github/`、`ops/`、`build.py`、`Cargo.toml` 与 `pyproject.toml`。
- `memory/` 保存运行态记忆，不作为系统真值替代品。
- 当前仓库于 2026-03-23 导入 `nautechsystems/nautilus_trader` 的 `master` 源码快照，但未继承其 Git 历史或 remote 绑定。
- 新增或重划生产代码路径时，必须同步更新 `ops/doc-truth-map.yaml`。
- `ops/doc-truth-registry.yaml` 仍是 truth role 到文档路径的唯一绑定来源。
