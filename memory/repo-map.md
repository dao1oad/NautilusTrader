# Repo Map

## Root

- `AGENTS.md`: agent 启动顺序、执行模型和协作规则
- `.cargo/`: Cargo 构建配置
- `.github/`: Issue/PR 模板与远端 workflow gate
- `.config/`: 开发与构建辅助配置
- `.docker/`: 容器相关配置
- `.pre-commit-hooks/`: pre-commit hook 脚本
- `.supply-chain/`: 供应链与审计相关配置
- `assets/`: 文档与品牌资源
- `crates/`: Rust workspace 与适配器实现
- `docs/system-truth/`: 系统静态真值，不由 `memory/` 替代
- `docs/plans/`: 设计与执行计划
- `examples/`: 回测、实盘、sandbox 与工具示例
- `governance/`: 面向人的治理规则与制度说明
- `memory/`: 运行态记忆、上下文和执行账本
- `nautilus_trader/`: Python/Cython 产品源码树
- `ops/`: 机器可读策略、review gate、truth registry/map
- `python/`: PyO3 Python surface、示例与相关测试
- `schema/`: SQL schema 定义
- `scripts/`: 初始化、自检、issue 编排与闭环脚本
- `tests/`: 产品测试与治理 smoke checks
- `workspace/`: issue packets、runbooks、handoffs 等运行产物

## Current Structure Facts

- 已存在目录：`.cargo/`、`.config/`、`.docker/`、`.github/`、`.pre-commit-hooks/`、`.supply-chain/`、`assets/`、`crates/`、`docs/`、`examples/`、`governance/`、`memory/`、`nautilus_trader/`、`ops/`、`python/`、`schema/`、`scripts/`、`tests/`、`workspace/`
- 当前仓库既包含治理控制面，也包含 NautilusTrader 的真实业务实现面
- 当前仓库保持独立 Git 仓库形态，不依赖上游 remote
