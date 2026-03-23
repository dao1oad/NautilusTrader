# NautilusTrader 管理控制台设计文档

## 1. 文档目的

本文档用于把 `NautilusTrader` 管理控制台从“方向性想法”收敛为“可进入正式开发的设计基线”。

- 本文档是 `docs/plans/` 下的计划文档，不替代 `docs/system-truth/` 静态真值
- 本文档给出首期开发边界、技术落点、治理要求和后续分期
- 本文档对应的首个真实开发 issue 为 GitHub issue `#8`

## 2. 项目定位与约束

当前仓库是一个独立维护的 `NautilusTrader` 衍生仓库，允许在上游核心交易引擎之外扩展本地控制面能力。

已确认约束：

- 使用场景：本机单人使用
- 运行位置：`localhost`
- 当前仓库仍以 Rust + Python/Cython + PyO3 核心为主，不引入 Node 到交易热路径
- 所有代码变更仍必须遵守 `issue -> PR -> remote Codex review -> merge`
- 新生产路径进入仓库时，必须同步 truth docs 与 `ops/doc-truth-map.yaml`

上游 [ROADMAP.md](/D:/NautilusTrader/ROADMAP.md) 明确将 UI dashboard / frontend 排除在开源主线范围之外；这不构成当前独立仓库的限制，但意味着本仓库必须自己承担控制面的目录落点、契约、测试和维护边界。

## 3. 决策摘要

本次冻结的设计决策如下：

- 接受独立控制面方案：`nautilus_trader/admin` + `apps/admin-web`
- 后端控制面采用独立 Python admin API，前端只消费 admin DTO，不直接消费内部 domain object
- 首期开发只做 `Phase 0`：只读 `Overview` 垂直切片
- 首期运行形态只承诺开发态双进程：Python admin API + Vite dev server
- 命令控制、审计 UI、订单页、日志页、桌面壳、打包发行全部延后，不进入 issue `#8`

## 4. 首期需求边界（Phase 0）

### 4.1 本阶段允许进入开发的范围

`Phase 0` 的目标不是“完整后台”，而是交付第一个治理闭环完整、可验证、可继续扩展的垂直切片。

本阶段仅包含：

- `nautilus_trader/admin` 生产路径落地
- typed admin DTO 与只读 `OverviewSnapshot`
- `/api/admin/health`
- `/api/admin/overview`
- `/ws/admin/events` 的最小事件契约
- `apps/admin-web` 的单页 `Overview` 壳层
- 全局连接状态、最后更新时间、空态、错误态、过期态（stale state）
- 前端本地 lint / test / build 命令
- 对应 truth docs、`ops/doc-truth-map.yaml`、`memory/*` 更新
- 针对新增路径的 CI 补齐

### 4.2 本阶段的完成定义

进入开发后的首个阶段必须至少满足：

- `pytest tests/unit_tests/admin -v` 通过
- `apps/admin-web` 的 lint、单测、build 都可在本地执行
- 概览页能覆盖以下状态：
  - 无 live node 配置
  - 后端快照为空
  - 后端返回局部失败
  - WebSocket 断开，前端显式显示 stale / disconnected
- truth docs 与 `ops/doc-truth-map.yaml` 已包含新生产路径
- CI 已对前端做基本校验

### 4.3 本阶段明确不做

- 任何危险控制命令：策略启停、适配器重连、订阅控制
- 订单、成交、持仓、账户、风控、日志等独立页面
- Playwright 端到端测试
- 把前端静态资源打进 Python wheel
- Tauri 或其他桌面壳
- 多用户、RBAC、SSO、远程部署

## 5. What Already Exists

首期设计必须优先复用现有能力，而不是平行重建。

### 5.1 现有运行时能力

- `nautilus_trader/live/node.py`
  - 已有 node 生命周期：`run`、`stop`、`dispose`
  - 已有内部消息总线处理和外部 stream 接入点
- `nautilus_trader/live/execution_client.py`
  - 已有 `generate_order_status_reports`
  - 已有 `generate_fill_reports`
  - 已有 `generate_position_status_reports`
  - 已有 `generate_mass_status`
- `nautilus_trader/persistence/catalog/base.py`
  - 已有 queryable catalog 抽象
- `tests/unit_tests/live/**` 与 `tests/unit_tests/persistence/**`
  - 已有可复用的 runtime / persistence 测试基座

### 5.2 现有治理与工程能力

- `.github/workflows/build.yml` 已是主工程 CI 面
- `scripts/check-governance.ps1` 已校验治理基线
- `ops/project-policy.yaml` 已启用 unmapped production path 阻断
- `memory/issue-ledger.md` 已作为 issue 执行账本

### 5.3 复用原则

- 浏览器不直接绑定 `live`、`execution`、`portfolio`、`risk`、`persistence` 内部对象
- admin API 只包装和投影既有运行时能力
- 除非出现第二个独立读取场景，否则不提前抽象多层 bridge / gateway / repository

## 6. 技术与目录落点

### 6.1 接受的生产路径

- 后端：admin API 落在 `nautilus_trader/admin/`
- 前端：admin web 源码落在 `apps/admin-web/`
- 后端单测落在 `tests/unit_tests/admin/`
- 前端单测落在 `apps/admin-web/src/test/`

### 6.2 首期接受的技术栈

- 后端：FastAPI + Pydantic
- 前端：React 19 + TypeScript + Vite
- 前端测试：Vitest + Testing Library
- 后端测试：pytest

### 6.3 首期明确延后的技术决策

以下工具不进入 `Phase 0`：

- TanStack Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- AG Grid
- Lightweight Charts
- Playwright

原因很简单：`Phase 0` 只有单页 `Overview` 垂直切片，上述依赖都会明显抬高变更面和 CI 成本，但不会提高首轮验证质量。

## 7. 推荐架构

### 7.1 逻辑结构

```text
+-----------------------+        REST / WS        +------------------------+
| Browser (localhost)   | <--------------------> | nautilus_trader/admin  |
| apps/admin-web        |                        | Python control plane   |
+-----------+-----------+                        +-----------+------------+
            |                                                |
            | Vite dev server (Phase 0 only)                 |
            |                                                v
            |                         +--------------------------------------+
            +-----------------------> | Existing NautilusTrader runtime      |
                                      | live / execution / portfolio / risk /|
                                      | persistence / msgbus                 |
                                      +--------------------------------------+
```

### 7.2 数据边界

前端只消费 admin DTO。

`Phase 0` 只定义以下对象：

- `OverviewSnapshot`
- `NodeSummary`
- `StrategySummary`
- `AdapterSummary`
- `AccountSummary`
- `PositionSummary`
- `SectionError`

`OverviewSnapshot` 必须至少包含：

- `generated_at`
- `stale`
- `partial`
- `node`
- `strategies`
- `adapters`
- `accounts`
- `positions`
- `errors`

### 7.3 事件边界

`Phase 0` 的 WebSocket 只允许最小事件集合：

- `subscribed`
- `connection.state`
- `overview.updated`
- `snapshot.invalidate`
- `server.error`

以下事件类型明确延后：

- `order.*`
- `fill.*`
- `position.*`
- `account.*`
- `risk.*`
- `command.*`

## 8. 交付与运行模型

### 8.1 `Phase 0` 运行模型

`Phase 0` 只定义开发态运行方式：

- 进程 1：Python admin API
- 进程 2：Vite dev server

本阶段不宣称“可发布安装包”或“可打包进 wheel”。

### 8.2 延后的交付问题

以下问题必须在后续独立 issue 中解决，不能挤进 `#8`：

- 静态资源是否嵌入 wheel
- Python 包发布时如何构建前端产物
- 离线资源策略
- 是否由后端托管静态文件
- 是否需要桌面壳

## 9. 治理对齐要求

要让管理控制台真正进入正式开发，必须同时满足以下治理约束：

- 首个实现 PR 必须绑定 GitHub issue `#8`
- 首个实现 PR 必须在同一 PR 内更新：
  - `docs/system-truth/architecture.md`
  - `docs/system-truth/module-boundaries.md`
  - `docs/system-truth/api-contracts.md`
  - `docs/system-truth/runtime-flows.md`
  - `ops/doc-truth-map.yaml`
- `ops/doc-truth-map.yaml` 必须新增 `apps/admin-web/**` 的生产路径映射
- `memory/active-context.md` 与 `memory/issue-ledger.md` 必须同步记录当前阶段
- 任何单个 PR 都不得同时引入：
  - 新控制命令
  - 多页面前端导航
  - 打包发行链路

建议的 PR 粒度：

- PR 1：治理落点 + backend scaffold + typed overview contract
- PR 2：frontend overview shell
- PR 3：WS 更新语义 + stale state
- PR 4：CI 接入与开发命令收尾

## 10. Failure Modes

`Phase 0` 至少要显式处理以下失败模式：

| 失败模式 | 用户可见结果 | 测试要求 |
| --- | --- | --- |
| 未配置 live node | 显示 `not_configured` / 空态，不崩溃 | 后端单测 + 前端空态单测 |
| 快照构建局部失败 | `partial=true` 且 `errors` 有内容 | 后端单测 |
| WebSocket 断开 | 前端显示 disconnected / stale banner | 后端单测 + 前端单测 |
| 后端返回 5xx | 页面显示错误态，不静默空白 | 前端单测 |
| Overview 数据过期 | 显示最后更新时间与 stale 状态 | 前端单测 |

如果某个失败模式既没有测试，也没有显式 UI 降级，就不算达到进入下一阶段的条件。

## 11. NOT In Scope

以下工作已明确评估，但不进入本轮：

- 策略控制命令：风险高，必须等只读契约稳定后再做
- 多页面运维台：会同时引入路由、导航和大量数据表，超出首期边界
- 专业表格与图表库：当前没有高密度表格场景，过早引入会增加维护负担
- Playwright：在没有稳定双进程 CI 和最终交付模型前收益有限
- 静态资源打包发行：这是独立交付问题，不应与首个只读垂直切片绑定
- Tauri：会把问题转成桌面工程，不符合当前最小可行路径

## 12. 后续路线图

在 `#8` 合并前，不再扩展 `Phase 0` 范围。

`#8` 之后采用正式执行 phase，而不是继续沿用原始路线图的细碎阶段。

### 12.1 原始路线图到正式执行 phase 的映射

- 正式 `Phase 1` 对应原始 `Phase 1 + Phase 2`
  - 目标：多页面控制台壳层 + 只读运维面
  - Umbrella issue：`#9`
  - 子 issue：`#13`、`#14`、`#15`
- 正式 `Phase 2` 对应原始 `Phase 3 + Phase 6` 中与命令/审计直接相关的部分
  - 目标：低风险控制命令 + 确认 + 审计闭环
  - Umbrella issue：`#10`
  - 子 issue：`#16`、`#17`、`#18`
- 正式 `Phase 3` 对应原始 `Phase 4 + Phase 5`
  - 目标：交易运维面 + 数据与诊断面
  - Umbrella issue：`#11`
  - 子 issue：`#19`、`#20`、`#21`
- 正式 `Phase 4` 对应原始 `Phase 7 + Phase 8`
  - 目标：统一工作台 + 交付硬化
  - Umbrella issue：`#12`
  - 子 issue：`#22`、`#23`、`#24`

### 12.2 对应计划文档

- `Phase 1`：[2026-03-23-nautilustrader-admin-console-phase-1-read-only-operations.md](/D:/NautilusTrader/docs/plans/2026-03-23-nautilustrader-admin-console-phase-1-read-only-operations.md)
- `Phase 2`：[2026-03-23-nautilustrader-admin-console-phase-2-control-audit.md](/D:/NautilusTrader/docs/plans/2026-03-23-nautilustrader-admin-console-phase-2-control-audit.md)
- `Phase 3`：[2026-03-23-nautilustrader-admin-console-phase-3-trading-operations-diagnostics.md](/D:/NautilusTrader/docs/plans/2026-03-23-nautilustrader-admin-console-phase-3-trading-operations-diagnostics.md)
- `Phase 4`：[2026-03-23-nautilustrader-admin-console-phase-4-workbench-delivery.md](/D:/NautilusTrader/docs/plans/2026-03-23-nautilustrader-admin-console-phase-4-workbench-delivery.md)

### 12.3 执行顺序

1. 先完成 `#8`
2. 再推进 `#9`
3. `#9` 完成后再推进 `#10`
4. `#10` 完成后再推进 `#11`
5. `#11` 完成后再推进 `#12`

## 13. 结论

修复后的结论是：

- 当前仓库可以进入正式开发
- 但只能按 issue `#8` 的 `Phase 0` 有界范围进入
- 进入开发的前提不再是“做完整后台”，而是“先做只读 overview 垂直切片，并把治理、契约、CI 和失败路径一次补齐”
