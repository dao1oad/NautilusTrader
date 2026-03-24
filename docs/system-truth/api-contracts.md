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
- `nautilus_trader/admin` 在 `Phase 0` 暴露本地 admin control plane contract：
  - `GET /api/admin/health`
  - `GET /api/admin/overview`
  - `GET/WS /ws/admin/events`
- `GET /api/admin/overview` 返回 typed admin DTO，而不是内部 domain object；`Phase 0` 至少包含 `OverviewSnapshot`、`NodeSummary`、`StrategySummary`、`AdapterSummary`、`AccountSummary`、`PositionSummary`、`SectionError`
- `/ws/admin/events` 在 `Phase 0` 只允许最小事件集合：`subscribed`、`connection.state`、`overview.updated`、`snapshot.invalidate`、`server.error`
- `apps/admin-web` 在 `Phase 0` 只消费上述 admin REST/WS contract，并以开发态双进程方式运行：浏览器 / `Vite` dev server <-> `nautilus_trader/admin`
- `apps/admin-web/vite.config.ts` 必须把同源 `/api/admin/*` 与 `/ws/admin/*` 请求代理到本地 admin API origin；默认目标为 `http://127.0.0.1:8000`
- `apps/admin-web/package.json` 在 `Phase 0` 约定最小前端命令面：
  - `npm run dev`：启动 `Vite` dev server
  - `npm run lint`：执行最小前端编译门禁，先校验当前 `Vite` import/bundle surface
  - `npm run test -- --run`：一次性执行 `Vitest`
  - `npm run build`：生成开发与 CI 验证用前端构建产物
- `crates/cli` 提供命令行接口产物；相关发布与打包流程由 `.github/workflows/cli-binaries.yml` 驱动
- `schema/sql/*.sql` 是持久化数据库对象定义接口，面向 `persistence` 层
- `examples/*` 与 `tests/*` 依赖上述 Python/Rust surface，不单独定义产品 API
- GitHub branch protection 通过 `gh api` 读取与校验
- GitHub Actions 暴露 `governance-check` 与 `pr-gate` 两个 required check
- `pr-gate` workflow 在 `pull_request`、`pull_request_review` 和 PR `issue_comment` 事件上运行，以便 PR 变更、review 提交或 Codex comment 到达后重新计算 merge gate；其中 `pull_request`/`pull_request_review` 使用 PR head SHA，`issue_comment` 使用 `refs/pull/<number>/head`
- `scripts/pre-pr-check.ps1` 读取 `pulls/{number}/reviews` 与 `issues/{number}/comments`，并接受 Codex connector 的 submitted review 或 `Codex Review` comment 作为远端 review 信号
- PR 元数据通过 `.github/PULL_REQUEST_TEMPLATE.md` 和 GitHub 事件负载传递

## Repository Operational Interfaces

- GitHub Actions 公开 `build`、`build-v2`、`coverage`、`docker`、`performance`、`security-audit`、`build-docs`、`nightly-tests` 等工程接口
- `governance-check` 与 `pr-gate` 继续作为当前独立仓库的合并门禁
- `build.yml` 的 push 触发与 `cargo-deny` / `cargo-vet` 分支条件必须对齐 `main`，否则受保护分支不会运行供应链检查
- `codeql-analysis.yml` 的 `pull_request` 分支过滤必须包含 `main`，否则面向 `main` 的 PR 不会运行 CodeQL
- `scripts/init-project.ps1` / `scripts/init-project.sh` 和 `scripts/check-governance.ps1` / `scripts/check-governance.sh` 是本仓库 bootstrap 与治理校验入口
- `scripts/sync-issues.ps1` / `scripts/sync-issues.sh`、`scripts/build-workset.ps1` / `scripts/build-workset.sh`、`scripts/close-loop.ps1` / `scripts/close-loop.sh` 负责 issue 同步、编排产物生成和 merge 后 memory 回写
- `scripts/pre-pr-check.ps1` 仍是当前本地 PR gate 预检查入口
- `scripts/rust-toolchain.sh` 负责把 Rust pin 暴露给 CI；`scripts/install-capnp.sh` 负责在 Linux/macOS 本地安装仓库要求的 Cap'n Proto 版本，并兼容 root 与非 root 环境

## Non-Contracts

- `memory/`、`workspace/` 和 `docs/system-truth/` 不是产品运行时 API
- `Phase 0` 不把前端静态资源打进 wheel，不定义桌面壳，不把 Playwright 当作已承诺接口
