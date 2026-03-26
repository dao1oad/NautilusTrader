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
- `crates/cli` 提供命令行接口产物；相关发布与打包流程由 `.github/workflows/cli-binaries.yml` 驱动
- `schema/sql/*.sql` 是持久化数据库对象定义接口，面向 `persistence` 层
- `examples/*` 与 `tests/*` 依赖上述 Python/Rust surface，不单独定义产品 API
- GitHub branch protection 通过 `gh api` 读取与校验
- GitHub Actions 暴露 `governance-check` 与 `pr-gate` 两个 required check
- `pr-gate` workflow 在 `pull_request` 事件上运行，并以本地 pre-PR review record 作为 review gate 输入
- `scripts/pre-pr-check.ps1` 读取 issue 链接、truth-doc 映射、memory 更新和 `workspace/handoffs/review-resolution-issue-<issue>.md` 作为本地 review 信号
- PR 元数据通过 `.github/PULL_REQUEST_TEMPLATE.md` 和 GitHub 事件负载传递

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
