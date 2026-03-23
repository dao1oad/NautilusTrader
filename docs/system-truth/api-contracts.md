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
- `Cargo.toml`
  - 契约：声明 workspace members、共享依赖与 adapter/core crate 边界；新 Rust 生产模块必须进入 workspace

## Runtime Interfaces

- Python import root 为 `nautilus_trader`；其包结构覆盖 `accounting`、`adapters`、`analysis`、`backtest`、`cache`、`common`、`config`、`core`、`data`、`execution`、`indicators`、`live`、`model`、`persistence`、`portfolio`、`risk`、`serialization`、`system`、`trading`
- `crates/cli` 提供命令行接口产物；相关发布与打包流程由 `.github/workflows/cli-binaries.yml` 驱动
- `schema/sql/*.sql` 是持久化数据库对象定义接口，面向 `persistence` 层
- `examples/*` 与 `tests/*` 依赖上述 Python/Rust surface，不单独定义产品 API

## Repository Operational Interfaces

- GitHub Actions 公开 `build`、`build-v2`、`coverage`、`docker`、`performance`、`security-audit`、`build-docs`、`nightly-tests` 等工程接口
- `governance-check` 与 `pr-gate` 继续作为当前独立仓库的合并门禁
- `scripts/check-governance.ps1`、`scripts/sync-issues.ps1`、`scripts/build-workset.ps1` 仍是本仓库治理与编排入口

## Non-Contracts

- `memory/`、`workspace/` 和 `docs/system-truth/` 不是产品运行时 API
