# Architecture Truth

## System

当前仓库是一个独立维护的 `NautilusTrader` 衍生仓库，由 Rust workspace、Python/Cython 包层、PyO3 桥接层、SQL 持久化 schema、示例与测试，以及治理控制面共同组成。

## Primary Code Planes

- `crates/`: Rust workspace，承载核心领域模型、回测、实盘、网络、持久化、风险、组合管理、CLI 与各交易所/数据源适配器。
- `nautilus_trader/`: 用户可见的 Python 包源码树，包含大量 Cython `.pyx`/`.pxd` 模块与高层 Python 接口。
- `python/nautilus_trader/`: Python/PyO3 暴露层与类型桩，负责把编译产物组织成稳定的 Python import surface。
- `schema/sql/`: 持久化后端的 SQL 类型、表、分区与函数定义。
- `examples/`: 回测、实盘、sandbox 与工具示例。
- `tests/`: 单元、集成、验收、性能、内存泄漏测试和测试数据。
- `scripts/`、`.github/`、`ops/`、`memory/`、`governance/`: 当前仓库保留的治理与自动化控制面。

## Build Model

- `pyproject.toml` 定义 Python 包 `nautilus_trader`，构建后端为 `poetry.core`，实际编译流程由根目录 `build.py` 驱动。
- `build.py` 先通过 `cargo build` 编译关键 Rust 库，再执行 Cython 扩展构建，并可选择把生成的二进制复制回源码树。
- `rust-toolchain.toml` 是 Rust 版本 pin 的单一真值；本地开发与 CI 都不应绕过这个 pin 漂移到不同 `stable` 版本。
- `Cargo.toml` 定义单一 Rust workspace；当前 workspace 版本为 `0.54.0`，Python 包版本为 `1.224.0`，两层版本号并不强制一致。

## Invariants

- 主 agent 在本地编排
- bounded issue 执行通过同机 `codex-orchestrator`
- 默认开启 truth-doc 门禁
- `main` 只通过 PR 合并，初始化阶段除外
- 开 PR 前必须完成本地 pre-PR review 与 review 闭环记录
- 当前仓库允许单维护者模式：GitHub approving review 计数可配置为 `0`，但不能替代本地 pre-PR review
- 当前仓库保留自己的 `.git`、`origin` 和治理规则；上游源码仅作为文件快照导入
- Python 运行时表面必须保持 `nautilus_trader/`、`python/nautilus_trader/`、`crates/pyo3` 与 Rust core crates 的接口一致性
- `schema/sql/` 变更属于持久化契约变更，必须同步更新 `data_model` 与 `api_contracts`
- 本机 `agentboard` 提供对 `codex-orchestrator` 会话的观测与人工接管能力
