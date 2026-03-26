# API Contracts Truth

## Build And Packaging Contracts

- `pyproject.toml`
  - 包名：`nautilus_trader`
  - Python 版本：`>=3.12,<3.15`
  - 构建后端：`poetry.core.masonry.api`
  - 可选依赖组：`betfair`、`ib`、`docker`、`polymarket`、`visualization`
- `build.py`
  - 输入：环境变量 `RUSTUP_TOOLCHAIN`、`BUILD_MODE`、`PROFILE_MODE`、`ANNOTATION_MODE`、`PARALLEL_BUILD`、`COPY_TO_SOURCE`、`FORCE_STRIP`、`PYO3_ONLY`、`DRY_RUN`、`HIGH_PRECISION`
  - 契约：先编译 Rust 关键库，再构建 Cython 扩展，并按平台处理链接参数与精度模式
  - Rust toolchain 约束：默认遵循仓库根目录 `rust-toolchain.toml` 的 pin；`RUSTUP_TOOLCHAIN` 仅用于显式切换到 `nightly` 或特定版本 pin
- `Cargo.toml`
  - 契约：声明 workspace members、共享依赖与 adapter/core crate 边界；新 Rust 生产模块必须进入 workspace
- `rust-toolchain.toml`
  - 契约：`channel` 是本地与 CI 共用的 Rust 单一真值 pin；不能出现“本地 latest stable、CI 固定旧版本”的漂移

## Runtime Interfaces

- Python import root 为 `nautilus_trader`；其包结构覆盖 `accounting`、`adapters`、`analysis`、`backtest`、`cache`、`common`、`config`、`core`、`data`、`execution`、`indicators`、`live`、`model`、`persistence`、`portfolio`、`risk`、`serialization`、`system`、`trading`
- `nautilus_trader.admin.schemas.CommandRequest`
  - 契约：管理命令请求统一携带 `command`、`target`、`payload`、`command_id`、`requested_at` 与 `requested_by`
  - 默认：当前固定为本机单人模式，`requested_by` 缺省值为 `local-operator`
- `nautilus_trader.admin.schemas.CommandReceipt`
  - 契约：所有管理控制结果都投影为 typed receipt，状态集合固定为 `accepted`、`completed`、`failed`
  - 字段：`command_id`、`command`、`target`、`status`、`recorded_at`、可选 `message` 与可选 `failure`
- `nautilus_trader.admin.schemas.CommandFailure`
  - 契约：失败回执与审计记录都复用同一错误体，至少包含稳定 `code`、人类可读 `message`、`retryable` 与结构化 `details`
- `nautilus_trader.admin.schemas.CommandErrorCode`
  - 契约：当前稳定错误码集合为 `invalid_request`、`not_found`、`conflict`、`not_supported`、`unavailable`、`internal_error`
- `nautilus_trader.admin.schemas.AuditRecord`
  - 契约：审计记录是 append-only 的浏览器/运维投影，固定包含单调递增 `sequence_id`、`command_id`、`status`、`payload`、`recorded_at` 与可选失败信息
- `crates/cli` 提供命令行接口产物；相关发布与打包流程由 `.github/workflows/cli-binaries.yml` 驱动
- `schema/sql/*.sql` 是持久化数据库对象定义接口，面向 `persistence` 层
- `examples/*` 与 `tests/*` 依赖上述 Python/Rust surface，不单独定义产品 API
- GitHub branch protection 通过 `gh api` 读取与校验
- GitHub Actions 暴露 `governance-check` 与 `pr-gate` 两个 required check
- `pr-gate` workflow 在 `pull_request` 事件上运行，并以本地 pre-PR review record 作为 review gate 输入
- `scripts/pre-pr-check.ps1` 读取 issue 链接、truth-doc 映射、memory 更新和 `workspace/handoffs/review-resolution-issue-<issue>.md` 作为本地 review 信号
- PR 元数据通过 `.github/PULL_REQUEST_TEMPLATE.md` 和 GitHub 事件负载传递

## Admin Read-Only Control Plane Contracts

- `nautilus_trader/admin/app.py`
  - 暴露只读 FastAPI surface：`GET /api/admin/health`、`GET /api/admin/overview`、`GET /api/admin/nodes`、`GET /api/admin/strategies`、`GET /api/admin/adapters`、`GET /api/admin/orders`、`GET /api/admin/positions`、`GET /api/admin/accounts`、`GET /api/admin/logs`
  - `orders`、`positions`、`accounts`、`logs` 四个列表 endpoint 都要求 `limit` query 参数满足 `1 <= limit <= 500`，默认值为 `100`
  - 当前只暴露 `GET` 与 `WebSocket /ws/admin/events`；`Phase 1` 不包含任何 mutating command endpoint
- `nautilus_trader/admin/schemas.py`
  - 定义浏览器可见 snapshot DTO：`OverviewSnapshot`、`NodesSnapshot`、`StrategiesSnapshot`、`AdaptersSnapshot`、`OrdersSnapshot`、`PositionsSnapshot`、`AccountsSnapshot`、`LogsSnapshot`
  - 所有列表 snapshot 都保留 `generated_at`、`partial`、`items`、`errors`；bounded list snapshot 额外保留 `limit`
- `apps/admin-web/src/shared/types/admin.ts`
  - 是前端对上述 DTO 的 TypeScript 镜像；前端只消费 admin DTO，不直接序列化内部 runtime object
- `apps/admin-web/src/shared/api/admin-client.ts`
  - 固定浏览器到后端的读取契约：`overview`、`nodes`、`strategies`、`adapters` 走无参 `GET`；`orders`、`positions`、`accounts`、`logs` 走带 `limit` 的 `GET`
  - `READ_ONLY_DEFAULT_LIMIT` 当前固定为 `100`
- `apps/admin-web/src/shared/realtime/admin-events.ts`
  - 固定浏览器侧 WS 入口为 `/ws/admin/events`
  - 当前识别的事件类型是 `subscribed`、`connection.state`、`overview.updated`、`snapshot.invalidate`、`server.error`
  - 连接建立后只订阅 `overview` channel，并把读到的事件交给 invalidation bus 与运行态状态管理

## Repository Operational Interfaces

- GitHub Actions 公开 `build`、`build-v2`、`coverage`、`docker`、`performance`、`security-audit`、`build-docs`、`nightly-tests` 等工程接口
- `governance-check` 与 `pr-gate` 继续作为当前独立仓库的合并门禁
- `build.yml` 的 push 触发与 `cargo-deny` / `cargo-vet` 分支条件必须对齐 `main`，否则受保护分支不会运行供应链检查
- `codeql-analysis.yml` 的 `pull_request` 分支过滤必须包含 `main`，否则面向 `main` 的 PR 不会运行 CodeQL
- `scripts/init-project.ps1` / `scripts/init-project.sh` 和 `scripts/check-governance.ps1` / `scripts/check-governance.sh` 是本仓库 bootstrap 与治理校验入口
- `scripts/sync-issues.ps1` / `scripts/sync-issues.sh`、`scripts/build-workset.ps1` / `scripts/build-workset.sh`、`scripts/close-loop.ps1` / `scripts/close-loop.sh` 负责 issue 同步、编排产物生成和 merge 后 memory 回写
- `scripts/ensure-local-runtime.ps1`、`scripts/start-local-agentboard.ps1`、`scripts/start-main-agent.ps1`、`scripts/dispatch-issue.ps1`、`scripts/sync-remote-execution.ps1`、`scripts/prepare-remote-pr.ps1` 是当前本机执行链入口
- `scripts/pre-pr-check.ps1` 是当前本地 PR gate 预检查入口
- `scripts/rust-toolchain.sh` 负责把 Rust pin 暴露给 CI；`scripts/install-capnp.sh` 负责在 Linux/macOS 本地安装仓库要求的 Cap'n Proto 版本，并兼容 root 与非 root 环境

## Non-Contracts

- `memory/`、`workspace/` 和 `docs/system-truth/` 不是产品运行时 API
