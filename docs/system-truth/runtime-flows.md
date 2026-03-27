# Runtime Flows Truth

## Build Flow

`pyproject/build.py 解析环境变量 -> cargo 编译关键 Rust 库 -> Cython/PyO3 扩展构建 -> 可选复制二进制回源码树 -> Python surface 导入编译产物`

本地与 CI 的 Rust 工具链都必须收敛到 `rust-toolchain.toml` 中同一个 pin；Linux 下 `scripts/install-capnp.sh` 必须能在 root 容器和普通用户环境中完成 Cap'n Proto 安装。

## Trading Runtime Flow

`数据源/交易所适配器 -> 规范化 market/order/account 事件 -> common/core/model -> backtest/live/execution -> portfolio/risk/system/trading -> persistence/serialization/报告输出`

## Admin Command Contract Flow

`操作意图 -> CommandRequest(command/target/payload/requested_by) -> command service 组装 typed receipt -> audit sink 追加 AuditRecord(sequence_id/status/payload) -> GET /api/admin/audit + /api/admin/config/diff / WS command.* -> admin-web receipt/audit/config 恢复面`

`Phase 2A` 的命令契约与审计边界当前已被 `Phase 2C` 绑定到浏览器恢复面，但仍不引入任何高风险交易执行流。

## Low-Risk Command Runtime Flow

`操作按钮 -> ConfirmCommandDialog 显式确认 -> POST /api/admin/commands/* -> submit_command(CommandRequest) -> HTTP 202 CommandReceipt(accepted) -> audit sink 追加 accepted/completed -> command event buffer -> /ws/admin/events(commands) 推送 command.accepted + command.completed -> command receipt bus 更新页面 receipt 卡片`

当前 command flow 仍是本机 stub mode：它验证和广播低风险控制意图，但不提前引入交易类命令或多用户权限流。

## Example And Test Flow

`examples/*` 与 `tests/*` 通过同一 `nautilus_trader` import surface 驱动回测、实盘、适配器和持久化场景，验证 Python 层与 Rust 核心的一致性

## Admin Read-Only Request Flow

`TanStack Router route -> route-owned page component -> TanStack Query query key -> apps/admin-web/src/shared/api/admin-client.ts -> /api/admin/* FastAPI route -> nautilus_trader/admin/services/* snapshot builder -> live/execution/portfolio/accounting/logging runtime surfaces -> admin snapshot DTO -> browser page render`

`Overview`、`Nodes`、`Strategies`、`Adapters`、`Risk center` 走无界单次 snapshot；`Orders`、`Fills`、`Positions`、`Accounts`、`Logs` 必须通过 `limit` 约束读取范围，避免 UI 发起无界查询。`/orders` route 在浏览器侧以 `Blotter` 呈现，且 trading ops 页面当前在单次 bounded snapshot 内执行 keyword filter 与前端分页（每页 `25` 行），不会把无界结果直接挂到 DOM。

`Positions` 页面当前允许操作员在表格中选择单行并展开同一 snapshot 内的 drill-down 详情；该详情只消费 `PositionSummary` 中已投影的可选字段，不会绕过 admin DTO 直接读取内部运行态对象。

`Accounts` 页面当前也允许在 bounded snapshot 内展开单个账户的 balances / exposure / alerts drill-down；`Risk center` 页面只消费单次 `RiskSnapshot` 中的 summary / events / blocks，不引入任何风险控制写流。

## Admin Realtime Refresh Flow

`/ws/admin/events -> apps/admin-web/src/shared/realtime/admin-events.ts -> apps/admin-web/src/shared/realtime/invalidation-bus.ts / command-receipt-bus.ts -> apps/admin-web/src/app.tsx query invalidation -> TanStack Query refetch -> 页面清理 transient runtime error 并刷新 receipt/audit/config surface`

当前 invalidation topic 固定为 `overview`、`nodes`、`strategies`、`adapters`、`audit`、`config`、`orders`、`fills`、`positions`、`accounts`、`risk`、`logs` 十二类；`overview.updated` 与 `snapshot.invalidate` 会广播到全部只读 surfaces，`command.*` 会触发 `audit` / `config` 刷新并同步当前页面 receipt。

## Admin Command Guardrail Flow

`Phase 2C` 的浏览器 mutating command flow 只能通过显式确认对话发起低风险控制；高风险交易命令、批量动作与多用户审批流仍被 guardrail 阻断。

`Phase 2` exit gate 当前要求 `#16/#17/#18` 全部合并、Phase 级验收命令通过，并保持“显式确认 + typed receipt + append-only 审计 + 无高风险交易命令”四项约束同时成立。

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
