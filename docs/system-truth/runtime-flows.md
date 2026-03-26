# Runtime Flows Truth

## Build Flow

`pyproject/build.py 解析环境变量 -> cargo 编译关键 Rust 库 -> Cython/PyO3 扩展构建 -> 可选复制二进制回源码树 -> Python surface 导入编译产物`

本地与 CI 的 Rust 工具链都必须收敛到 `rust-toolchain.toml` 中同一个 pin；Linux 下 `scripts/install-capnp.sh` 必须能在 root 容器和普通用户环境中完成 Cap'n Proto 安装。

## Trading Runtime Flow

`数据源/交易所适配器 -> 规范化 market/order/account 事件 -> common/core/model -> backtest/live/execution -> portfolio/risk/system/trading -> persistence/serialization/报告输出`

## Example And Test Flow

`examples/*` 与 `tests/*` 通过同一 `nautilus_trader` import surface 驱动回测、实盘、适配器和持久化场景，验证 Python 层与 Rust 核心的一致性

## Repository Operational Flow

`GitHub issue -> 主 agent 编排 -> 本机 codex-orchestrator 执行 -> 本地 pre-PR review -> PR -> review 闭环 -> merge -> memory/system-truth 回写`

本地治理入口在 Windows 使用 `scripts/*.ps1`，在 Linux/macOS 使用对应的 `scripts/*.sh`。两组脚本都围绕同一仓库根目录、`memory/` 和 `workspace/` 产物工作。

## PR Gate Flow

1. 校验 issue 关联
2. 校验 memory 更新
3. 校验 truth-doc 映射与同步
4. 校验本地 pre-PR review record
5. 校验 PR conversation 已闭环

## Security Workflow Flow

1. 面向 `main` 的 PR 会触发 `codeql-analysis`
2. 合并进入 `main` 的 push 会触发 `build.yml`
3. `build.yml` 中的 `cargo-deny` 与 `cargo-vet` 仅在 `refs/heads/main` 上运行，用于覆盖受保护主分支的供应链检查

## Local Execution Sync Flow

1. `scripts/start-main-agent.ps1` 先运行 `scripts/ensure-local-runtime.ps1`
2. 然后启动 `scripts/start-local-agentboard.ps1`
3. 主 agent 运行 `scripts/sync-issues.ps1` 与 `scripts/build-workset.ps1`
4. 若存在可执行 issue，则通过 `scripts/dispatch-issue.ps1` 启动本机 job
5. `scripts/sync-remote-execution.ps1` 把 job 状态回写到 `workspace/runbooks/remote-jobs.json` 与 `memory/issue-ledger.md`
6. `scripts/prepare-remote-pr.ps1` 为 issue 生成本地 review 证据与输出归档
7. `scripts/pre-pr-check.ps1` 在开 PR 前验证 local review、truth-doc 和 memory

## Truth Rebinding Flow

1. 识别真实代码与自动化路径
2. 更新 `docs/system-truth/` 真值文档
3. 更新 `ops/doc-truth-registry.yaml`
4. 更新 `ops/doc-truth-map.yaml`
5. 若仍存在未映射生产路径，则阻断进入 PR
