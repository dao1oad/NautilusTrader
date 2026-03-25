# Runtime Flows Truth

## Build Flow

`pyproject/build.py 解析环境变量 -> cargo 编译关键 Rust 库 -> Cython/PyO3 扩展构建 -> 可选复制二进制回源码树 -> Python surface 导入编译产物`

本地与 CI 的 Rust 工具链都必须收敛到 `rust-toolchain.toml` 中同一个 pin；Linux 下 `scripts/install-capnp.sh` 必须能在 root 容器和普通用户环境中完成 Cap'n Proto 安装。

## Trading Runtime Flow

`数据源/交易所适配器 -> 规范化 market/order/account 事件 -> common/core/model -> backtest/live/execution -> portfolio/risk/system/trading -> persistence/serialization/报告输出`

## Admin Control Plane Flow

`Browser route -> apps/admin-web routed console shell -> TanStack Query cache + shared page states -> REST/WS -> nautilus_trader/admin -> 既有 live/execution/portfolio/risk/persistence surfaces -> typed admin DTO / connection state -> Browser`

当前后端 contract 已定义 `health`、`overview`、`nodes`、`strategies`、`adapters`、`orders`、`positions`、`accounts`、`logs` 与最小 WS invalidation / connection-state 语义；其中交易与日志 surface 通过 bounded `limit` query 控制默认窗口，`logs` 允许显式 partial payload。浏览器侧则通过 routed shell + query key + shared page-state 驱动 8 个已接通的只读页面，不在此阶段定义最终静态资源托管或桌面交付流。

## Admin Development Flow

1. 终端 A：启动 `nautilus_trader/admin` 本机 FastAPI 进程，暴露 `/api/admin/*` 与 `/ws/admin/events`
2. 终端 B：`cd apps/admin-web && npm run dev`，启动 `Vite` dev server
3. 浏览器：由 routed console shell 装载当前 route，并通过 query client 访问本机 admin REST / WS contract
4. `overview.updated` / `snapshot.invalidate` 事件先进入 invalidation bus，再由 query client 触发 `overview`、`nodes`、`strategies`、`adapters`、`orders`、`positions`、`accounts`、`logs` 八组 query 失效与重拉
5. 前端 CI 继续复用最小命令面：`npm ci -> npm run lint -> npm run test -- --run -> npm run build`
6. 当前阶段不把静态资源打进 wheel，不定义桌面壳，不把 `Playwright` 或多用户部署写成既成运行流

## Example And Test Flow

`examples/*` 与 `tests/*` 通过同一 `nautilus_trader` import surface 驱动回测、实盘、适配器和持久化场景，验证 Python 层与 Rust 核心的一致性

## Repository Operational Flow

`GitHub issue -> 主 agent 编排 -> subagent 执行 -> 本地 review 记录 -> PR -> pr-gate/build -> merge -> memory/system-truth 回写`

本地治理入口在 Windows 使用 `scripts/*.ps1`，在 Linux/macOS 使用对应的 `scripts/*.sh`。两组脚本都围绕同一仓库根目录、`memory/` 和 `workspace/` 产物工作。
`scripts/build-workset.ps1` / `scripts/build-workset.sh` 根据最新 issues snapshot 重建依赖状态与 issue packets 时，必须保留 `memory/issue-ledger.md` 中已存在的非默认 PR 跟踪与人工 next 注释，避免活跃执行状态被刷新脚本抹掉。
`scripts/build-workset.ps1` / `scripts/build-workset.sh` 只把 issue 正文中 `Depends on` 段内的 issue 引用视为执行依赖；`Parent`、`Child issues` 和其它说明性引用不能进入依赖图。
仓库的本地化治理文档和计划文档不参与 English-only non-Latin gate；该 lint 主要用于保护共享源码、workflow、脚本和通用工程配置不混入非预期脚本字符。

## PR Gate Flow

1. 校验 issue 关联
2. 校验 memory 更新
3. 校验 truth-doc 映射与同步
4. 校验本地 review 记录存在且状态满足要求

## Security Workflow Flow

1. 面向 `main` 的 PR 会触发 `codeql-analysis`
2. 合并进入 `main` 的 push 会触发 `build.yml`
3. `build.yml` 中的 `cargo-deny` 与 `cargo-vet` 仅在 `refs/heads/main` 上运行，用于覆盖受保护主分支的供应链检查

## PR Review Re-evaluation Flow

1. PR 创建或同步时触发 `pr-gate`
2. 若 linked issue 缺失、本地 review 记录缺失或状态不满足要求，`pr-gate` 失败并阻止合并
3. 本地 review 记录通过提交进入 PR 分支后，新的 `pull_request` sync 会再次触发 `pr-gate`
4. `pr-gate` 使用 PR head SHA 读取最新分支内容，避免把默认分支的旧治理文件误当成当前 gate 依据
5. 在单维护者模式下，只要本地 review 记录、required checks 与其他门禁满足，PR 可在无额外人工 Approve 的情况下进入可合并状态

## Truth Rebinding Flow

1. 识别真实代码与自动化路径
2. 更新 `docs/system-truth/` 真值文档
3. 更新 `ops/doc-truth-registry.yaml`
4. 更新 `ops/doc-truth-map.yaml`
5. 若仍存在未映射生产路径，则阻断进入 PR
