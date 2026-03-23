# Repo Map

## Root

- `AGENTS.md`: agent 启动顺序、执行模型和协作规则
- `.github/`: Issue/PR 模板与远端 workflow gate
- `docs/plans/`: 设计与执行计划
- `docs/system-truth/`: 系统静态真值，不由 `memory/` 替代
- `governance/`: 面向人的治理规则与制度说明
- `memory/`: 运行态记忆、上下文和执行账本
- `ops/`: 机器可读策略、review gate、truth registry/map
- `scripts/`: 初始化、自检、issue 编排与闭环脚本
- `tests/smoke/`: 模板与治理 smoke checks
- `workspace/`: issue packets、runbooks、handoffs 等运行产物

## Current Structure Facts

- 已存在目录：`.github/`、`docs/`、`governance/`、`memory/`、`ops/`、`scripts/`、`tests/`、`workspace/`
- 当前不存在目录：`src/`、`app/`、`lib/`、`services/`
- 目前可视为“治理控制面仓库”，业务实现面尚未接入
