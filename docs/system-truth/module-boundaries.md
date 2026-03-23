# Module Boundaries Truth

## Core Boundaries

- `governance/`: 面向人的规则、流程、门槛说明
- `memory/`: 运行态记忆与执行账本，不承担静态真值职责
- `docs/system-truth/`: 静态系统真值，约束代码与自动化的应然状态
- `ops/`: 机器可读配置、review gate 与 truth 绑定规则
- `scripts/`: 本地可执行治理逻辑与 issue 编排入口
- `.github/`: 远端 gate、PR 模板与 issue 模板
- `tests/smoke/`: 对治理骨架的验证，不作为生产路径
- `workspace/`: 运行时产物与中间文件，不作为生产路径

## Current Absences

- 当前不存在 `src/`、`app/`、`lib/`、`services/` 目录。
- 因此当前 truth 绑定只覆盖治理控制面，不虚构业务模块边界。
