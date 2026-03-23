# NautilusTrader 管理 UI 设计文档

## 1. 背景

当前仓库已导入 `nautechsystems/nautilus_trader` 源码快照，但上游项目在 [ROADMAP.md](/D:/NautilusTrader/ROADMAP.md) 中明确将 UI dashboard / frontend 视为开源主线范围外能力。  
因此，本仓库新增前端的正确定位不是“补一个演示页面”，而是为当前独立仓库建立一套可持续维护的本机单人运维控制台。

本设计基于以下已确认约束：

- 使用场景：本机单人使用
- 交付形态：`localhost` Web 控制台
- 目标：先定义 `NautilusTrader` 的完整能力清单，再按依赖关系分阶段建设管理 UI
- 范围：最终覆盖实盘运维、诊断、数据浏览、后续回测与分析扩展；首期不以“只做一个页面”为目标

## 2. 设计目标

- 为 `NautilusTrader` 建立完整的本机管理控制面，而不是零散页面集合
- 让前端只依赖稳定的管理 API，不直接耦合内部模块细节
- 支持高频实时更新场景，包括日志流、订单流、持仓、连接状态和告警
- 允许未来从“本机单人”平滑演进到“远程多用户”，但不在当前阶段引入该复杂度
- 保持与当前 Rust + Python/Cython + PyO3 架构兼容，不强行把核心引擎搬到 Node 生态

## 3. 非目标

- 不把前端做成营销官网
- 不把前端做成策略开发 IDE
- 不让浏览器直接接触交易所凭据
- 不在第一轮引入多用户、RBAC、SSO、团队协作
- 不把 UI 逻辑硬耦合进现有 Cython / Rust 核心模块

## 4. NautilusTrader 完整能力清单

| 能力域 | 代码依据 | 当前已有能力 | 管理 UI 应覆盖的最终能力 |
| --- | --- | --- | --- |
| 系统内核 | `crates/system` `crates/common` `crates/core` | 事件驱动、时钟、消息总线、组件生命周期 | 节点状态、运行拓扑、事件吞吐、组件健康 |
| 市场数据 | `crates/data` `nautilus_trader/data` | quote / trade / bar / order book / custom data 管线 | 订阅状态、行情延迟、最新数据、数据质量 |
| 领域模型 | `crates/model` `nautilus_trader/model` | instrument、identifier、order、position、price、quantity 等统一模型 | 标的浏览、交易规则、元数据展示 |
| 适配器集成 | `crates/adapters/*` | Binance / Bybit / OKX / Betfair / Databento / Tardis 等接入 | 连接状态、重连、配置、错误面板 |
| 实盘运行 | `crates/live` `nautilus_trader/live` | live node、数据链路、执行链路 | 节点总览、策略挂载、运行会话 |
| 执行管理 | `crates/execution` `nautilus_trader/execution` | 订单、成交、执行回报、算法单、模拟执行 | blotter、命令结果、订单追踪、成交联查 |
| 账户会计 | `nautilus_trader/accounting` | cash / margin / betting 账户、保证金计算 | 余额、冻结、保证金、资金变动 |
| 组合管理 | `crates/portfolio` `nautilus_trader/portfolio` | 持仓、PnL、估值、汇率转换 | 持仓页、盈亏、敞口、净值与资产视图 |
| 风控 | `crates/risk` `nautilus_trader/risk` | 风险校验、限额、sizing、greeks | 风控事件、阻断原因、风险概览 |
| 持久化 | `crates/persistence` `schema/sql` | catalog、数据库、Arrow/Parquet、wranglers | 历史查询、catalog 浏览、数据检索 |
| 序列化 | `crates/serialization` | 事件与数据编码 | 导入导出、消息追踪、数据交换 |
| 分析报告 | `crates/analysis` | statistics、reports、tear sheet 能力 | 运行报表、健康指标、图表摘要 |
| 回测 | `crates/backtest` `nautilus_trader/backtest` | 多市场回测、历史重放 | 后续回测任务和结果浏览 |
| 策略与配置 | `nautilus_trader/trading` `nautilus_trader/config` | 策略配置、系统装配、组件组合 | 策略清单、配置查看、配置差异 |
| CLI / 工程控制 | `crates/cli` `scripts/` | CLI、构建、运维脚本、诊断能力 | 系统诊断、版本信息、任务入口 |
| 文档 / 示例 | `docs/` `examples/` | 教程、示例、集成说明 | 内嵌帮助、错误说明、runbook |

结论：管理 UI 的真实边界不是“订单页 + 持仓页”，而是整个平台的本机控制面。

## 5. 前端技术趋势分析

截至 2026-03-23，与本项目最相关的趋势如下：

- React 19 已稳定，适合实时订阅、副作用隔离和现代表单处理
- React 官方已弃用 CRA，新前端应使用框架或 Vite/Rsbuild 一类现代工具链
- Vite 持续演进，适合本机单页控制台的快速开发、低心智负担和高热更新效率
- `shadcn/ui` 代表的 open-code 组件体系更适合高密度专业控制台，而非通用后台皮肤
- Container Queries、View Transition API 等平台能力已足够成熟，可直接用于响应式工作台
- AG Grid / Lightweight Charts 这类专业组件适合高频数据、金融图表和表格场景
- Playwright 依旧是最稳妥的端到端测试基线

对本项目的含义：

- 不推荐从 `Next.js` 起步。它对内容页和服务端渲染很强，但会把系统变成 `Node + Python + Rust` 三栈并行，本机运维台首轮没有必要承担这个复杂度。
- 不推荐直接做桌面壳应用。Tauri 可以作为后续封装层，但不应成为前端第一步。
- 推荐从独立 `React 19 + Vite` 控制台起步，并新增一层本机 Python 管理 API。

## 6. 备选方案

### 方案 A：独立 SPA + Python 管理 API + WebSocket 事件流

结构：

- 前端：`apps/admin-web/`
- 控制面后端：`nautilus_trader/admin/`
- 通信：REST + WebSocket

优点：

- 与现有 Python/Rust 架构最兼容
- 运行和部署最简单
- 易于后续扩展为桌面壳或远程版

缺点：

- 需要自己设计管理 API 契约
- 需要单独处理前端工程集成

### 方案 B：Next.js 全栈前端

优点：

- 服务端路由、表单、SSR、鉴权生态成熟

缺点：

- 三栈并行复杂度明显升高
- 对本机单用户运维台收益有限

### 方案 C：Tauri 桌面壳优先

优点：

- 交互上更像专业终端
- 更适合长期桌面产品化

缺点：

- 打包、升级、桌面权限和进程协同成本更高
- 过早把问题转成桌面工程问题

### 结论

推荐方案 A。  
未来如果需要桌面交付，再在方案 A 的基础上用 Tauri 封装。

## 7. 推荐架构

### 7.1 组件结构

- `apps/admin-web/`
  - `src/app/`: 应用壳层、路由、布局、主题
  - `src/features/`: dashboard、nodes、strategies、orders、fills、positions、accounts、risk、logs、adapters、catalog
  - `src/entities/`: instrument、order、position、strategy、adapter、account
  - `src/shared/`: API client、event bus、types、components、charts、grid、utils
- `nautilus_trader/admin/`
  - `api/`: REST 路由
  - `ws/`: WebSocket 事件推送
  - `services/`: 快照服务、命令服务、日志聚合、节点状态服务
  - `schemas/`: API DTO / 事件 DTO
  - `bridge/`: 与现有 live / execution / portfolio / risk / persistence 的桥接层

### 7.2 通信模型

- `REST`
  - 获取快照
  - 查询详情
  - 发送控制命令
- `WebSocket`
  - 推送状态更新
  - 推送日志、告警、订单/成交/持仓变化
  - 推送命令执行结果和任务进度

### 7.3 UI 原则

- 桌面优先，但必须可在较窄窗口退化
- 高信息密度，少装饰、多状态
- 读写分离，危险操作必须明确二次确认
- 页面不假设单一交易所或单一账户
- 所有实时卡片都必须有“最后更新时间”和“连接状态”

## 8. 信息架构

最终工作台建议采用以下一级导航：

- `Overview`
- `Nodes`
- `Strategies`
- `Adapters`
- `Orders`
- `Fills`
- `Positions`
- `Accounts`
- `Risk`
- `Logs`
- `Data / Catalog`
- `Reports`
- `Settings`

说明：

- `Overview` 是全局驾驶舱
- `Nodes / Strategies / Adapters` 是运行控制面
- `Orders / Fills / Positions / Accounts / Risk` 是交易运维主面
- `Logs / Data / Catalog / Reports` 是诊断与历史侧

## 9. 数据与事件模型

前端不应直接消费内部 domain object。控制面应提供单独的 admin DTO。

核心快照对象：

- `NodeSnapshot`
- `StrategySnapshot`
- `AdapterSnapshot`
- `OrderSnapshot`
- `FillSnapshot`
- `PositionSnapshot`
- `AccountSnapshot`
- `RiskSnapshot`
- `LogEntry`
- `AlertEvent`

核心事件类型：

- `node.updated`
- `strategy.started`
- `strategy.stopped`
- `adapter.connected`
- `adapter.disconnected`
- `order.created`
- `order.updated`
- `fill.received`
- `position.updated`
- `account.updated`
- `risk.triggered`
- `log.appended`
- `command.accepted`
- `command.completed`
- `command.failed`

## 10. 安全与控制边界

虽然当前场景是本机单人使用，仍然需要明确边界：

- 浏览器不直接持有交易所 API key
- 所有控制动作只能通过本机管理 API 下发
- 危险命令必须显式确认，并记录审计日志
- 即使没有多用户，也要预留命令审计和错误可追溯能力
- WebSocket 断开后 UI 必须显式降级，而不是静默展示过期状态

## 11. 分阶段实施

### Phase 0：控制面地基

- 新增本机管理 API
- 新增快照接口和 WebSocket 事件总线
- 新增命令总线、错误码和审计模型
- 新建前端工程骨架

### Phase 1：控制台壳层

- 路由、布局、导航、主题、全局状态、通知、快捷键
- 全局连接栏、事件时间戳、空态和错误态标准化

### Phase 2：只读观测面

- Dashboard
- 节点状态
- 适配器状态
- 策略列表
- 日志流
- 订单 / 成交 / 持仓 / 余额只读页

### Phase 3：运行控制面

- 启停策略
- 适配器重连 / 启停
- 行情订阅控制
- 配置查看与命令结果回执

### Phase 4：交易运维面

- 深度 blotter
- 持仓 drill-down
- 账户与保证金
- 风控事件和告警中心

### Phase 5：数据与诊断面

- catalog / persistence 浏览
- 历史查询
- 事件回放
- 数据链路诊断

### Phase 6：高级运维面

- 配置 diff
- 批量操作
- 命令审计
- 恢复工具和 runbook

### Phase 7：统一工作台

- 接入回测任务、分析和报告
- 实现运维与分析工作台统一壳层

### Phase 8：交付硬化

- 本机安装包
- 离线资源
- 可选 Tauri 壳层
- 性能预算与前端监控

## 12. 风险

- 当前仓库没有现成管理 API，首个真正成本不在页面，而在控制面协议
- 实时事件源分散在 live / execution / portfolio / risk / persistence 多层，需要统一桥接
- 若前端过早直接依赖内部对象，会导致后续 Rust/Cython 演进时大量返工
- 若首轮就加入高风险交易命令，安全护栏复杂度会显著提高

## 13. 结论

正确路线不是“给 NautilusTrader 补一个前端页面”，而是：

1. 把平台完整能力映射成独立控制面
2. 建立本机管理 API 与事件桥接层
3. 用 `React 19 + Vite` 构建高密度专业运维台
4. 按依赖关系分阶段建设，从基础设施到完整工作台逐步推进
