# Module Boundaries Truth

## Product Boundaries

- `crates/analysis` 到 `crates/trading`: Rust 核心领域与运行时模块，负责性能关键路径。
- `crates/adapters/*`: 交易所、数据源与 sandbox 适配器；边界职责是协议接入、字段转换与 venue-specific 行为，不承载通用核心逻辑。
- `nautilus_trader/*`: Python/Cython 域层，向策略、回测、实盘和工具使用者暴露统一包结构。
- `nautilus_trader/admin/*`: 本地管理控制面；职责是把 `live`、`execution`、`portfolio`、`risk`、`persistence` 等运行时能力投影成 admin DTO 与最小控制台 contract，而不是复制核心业务逻辑。
- `python/nautilus_trader/*`: PyO3 输出层与类型桩；职责是稳定 Python import surface，而不是重新实现业务逻辑。
- `apps/admin-web/*`: 本机控制台前端；职责是展示 admin DTO、连接状态与显式 degraded state，不承载交易热路径或内部对象访问。
- `schema/sql/*`: 数据库持久化对象定义；其边界与 `crates/persistence`、`nautilus_trader/persistence` 对齐。
- `examples/*`: 示例与演示流，不作为产品真值来源。
- `tests/*`: 验证层，不作为产品真值来源。

## Control Plane Boundaries

- `governance/`: 面向人的规则、流程与门槛说明。
- `memory/`: 运行态记忆与执行账本，不承担静态真值职责。
- `docs/system-truth/`: 静态系统真值，约束真实代码与自动化边界。
- `ops/`: 机器可读配置、review gate 与 truth 绑定规则。
- `scripts/`: 本地执行入口，既包含治理脚本，也包含上游工程脚本。
- `.github/`: 远端 CI/CD、issue/PR 模板与治理 gate。
- `workspace/`: 运行时产物与中间文件，不作为生产路径。

## Boundary Rules

- 新的 venue adapter 应进入 `crates/adapters/<venue>`，并在 Python surface、文档与测试层保持同名或同职责映射。
- 性能关键逻辑优先进入 Rust crates；Python/Cython 层负责用户接口、组合装配和编译后暴露。
- `apps/admin-web` 不得直接读取 `live`、`execution`、`portfolio`、`risk`、`persistence` 内部对象；浏览器边界必须固定在 `nautilus_trader/admin` 的 DTO contract。
- `nautilus_trader/admin` 可以包装既有运行时能力；当前后端 contract 包含 `health`、`overview`、`nodes`、`strategies`、`adapters`、`orders`、`positions`、`accounts`、`logs` 与最小 WS 事件集合，但仍未扩展到命令控制或完整 domain surface。
- `apps/admin-web/src/app/*` 负责 router、layout 和 route-level composition；`apps/admin-web/src/shared/query/*` 负责 query client 与 query key；`apps/admin-web/src/shared/realtime/*` 负责 WebSocket transport 与 invalidation bus；`apps/admin-web/src/shared/ui/*` 负责跨页面复用的 page-state / status UI。
- `tests/`、`examples/`、`memory/`、`workspace/` 不得被当作产品静态真值。
- `ops/review-gates.yaml` 中的 review 约束只放宽 GitHub 人工 approving review，不放宽本地 PR review 或 PR-only 约束。
- 本地构建辅助脚本必须在 Linux 开发机和容器内可直接运行，不能隐式要求 Windows-only 路径或在 root 环境下强依赖 `sudo`。
