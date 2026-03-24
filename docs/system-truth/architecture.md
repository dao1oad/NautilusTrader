# Architecture Truth

## System

当前仓库是一个独立维护的 `NautilusTrader` 衍生仓库，由 Rust workspace、Python/Cython 包层、PyO3 桥接层、SQL 持久化 schema、示例与测试，以及治理控制面共同组成。

## Primary Code Planes

- `crates/`: Rust workspace，承载核心领域模型、回测、实盘、网络、持久化、风险、组合管理、CLI 与各交易所/数据源适配器。
- `nautilus_trader/`: 用户可见的 Python 包源码树，包含大量 Cython `.pyx`/`.pxd` 模块与高层 Python 接口。
- `nautilus_trader/admin/`: 本地管理控制面 Python API 与 DTO 投影层，负责把运行时状态包装成浏览器可消费的 admin contract；当前已提供 overview 与 `nodes/strategies/adapters` 只读 list snapshot。
- `python/nautilus_trader/`: Python/PyO3 暴露层与类型桩，负责把编译产物组织成稳定的 Python import surface。
- `schema/sql/`: 持久化后端的 SQL 类型、表、分区与函数定义。
- `apps/admin-web/`: 本机运维控制台前端源码树；当前已具备 `TanStack Router` 驱动的多页面 console shell、`TanStack Query` 驱动的只读查询层，以及浏览器侧 shared page-state / invalidation 基座，并已接通 `Overview`、`Nodes`、`Strategies`、`Adapters` 四个只读页面。
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
- subagent 在云端执行
- 默认开启 truth-doc 门禁
- `main` 只通过 PR 合并，初始化阶段除外
- merge 前必须完成远端 Codex review 与本地 review 闭环记录
- 当前仓库允许单维护者模式：GitHub approving review 计数可配置为 `0`，但不能替代远端 Codex review
- 当前仓库保留自己的 `.git`、`origin` 和治理规则；上游源码仅作为文件快照导入
- `scripts/build-workset.ps1` 与 `scripts/build-workset.sh` 会根据 issues snapshot 重建 `memory/issue-ledger.md` 和 issue packets，但不应抹掉活跃 issue 已记录的 PR 关联或非默认 next 注释
- `scripts/build-workset.ps1` 与 `scripts/build-workset.sh` 只把 issue 正文中 `Depends on` 段声明的引用纳入执行依赖图；`Parent`、`Child issues` 与其它说明性引用属于编排元数据，不得反向阻塞具体实施 issue
- 仓库中的治理、记忆、truth-doc 与计划文档允许保留本地化运营语言；English-only 的非 Latin lint 主要约束共享源码、workflow、脚本与通用工程配置
- Python 运行时表面必须保持 `nautilus_trader/`、`python/nautilus_trader/`、`crates/pyo3` 与 Rust core crates 的接口一致性
- `apps/admin-web` 只能通过 `nautilus_trader/admin` 暴露的 admin DTO 与 REST/WS contract 读取状态，不直接绑定内部 domain object；浏览器侧数据刷新必须收敛到 query key + invalidation bus，而不是在页面组件里散落手工 `fetch`/`WebSocket` 刷新逻辑
- `Phase 0` 的 admin control plane 只承诺开发态双进程：Python admin API + `Vite` dev server；不宣称 wheel 打包、桌面壳或最终静态资源托管模型
- `schema/sql/` 变更属于持久化契约变更，必须同步更新 `data_model` 与 `api_contracts`
- GitHub 中的远端 Codex review 由 Codex connector 在 PR 上留下的 submitted review 或 `Codex Review` 评论体现，而不是仓库协作者手工代替
