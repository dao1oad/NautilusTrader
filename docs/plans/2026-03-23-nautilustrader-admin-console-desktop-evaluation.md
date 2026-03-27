# NautilusTrader Admin Console Desktop Evaluation

## Context

`Phase 4C` 需要锁定管理控制台的最终交付模型，并明确是否要把当前本机单用户工作台继续推进到桌面壳实现。

当前已实现的基础条件：

- FastAPI 可同源托管构建后的 admin-web bundle
- 浏览器端已统一到 `Operations` / `Analysis` workbench
- REST 与 WebSocket 都围绕本机单用户工作流设计
- CI 已具备 frontend build、bundle budget 与 Playwright smoke gate

## Evaluated Options

### Option A: Backend-hosted web bundle

把 `apps/admin-web/dist` 作为最终交付产物，由 `nautilus_trader.admin.app` 在 `/` 与 SPA deep link 路径下托管。

优点：

- 继续复用现有 FastAPI + REST + WebSocket 同源模型
- 本机启动与 CI 验证路径一致，交付面最少
- 不引入第二套桌面更新、打包、权限或崩溃诊断链路

代价：

- 首次打包仍需构建 web bundle
- 桌面级原生菜单、托盘与文件系统集成能力仍需后续单独评估

### Option B: 独立静态站点或前端单独分发

把 admin-web 作为完全独立站点部署/分发，后端只保留 API/WS。

优点：

- 前后端职责分离更直观
- 可独立演进前端托管策略

代价：

- 当前仓库与 issue 范围都是本机单用户控制面，这会额外引入 origin、proxy、部署与发布复杂度
- 同源 WebSocket / REST 约束会被替换成额外的环境配置面

### Option C: 立即进入 Tauri 桌面壳实现

直接为当前 admin-web 增加 Tauri 容器与桌面打包。

优点：

- 提前验证桌面壳体验
- 后续可扩展原生系统集成能力

代价：

- 当前还没有必须依赖原生桌面能力的需求
- 会立刻引入第二套构建链、签名/发布策略、平台差异与更多 review 面
- 对当前 Phase 4 目标没有形成等价价值回报

## Recommendation

采用 Option A 作为当前正式交付模型：

- 默认交付物是 backend-hosted web bundle
- FastAPI 根入口负责托管前端静态资产
- wheel/sdist 为 `nautilus_trader/admin/static/**/*` 预留 bundle 打包入口
- CI 以 production build + bundle budget + Playwright smoke 作为交付硬化门禁

## Tauri Decision

当前不进入 Tauri 实现。

结论：

- `defer`

原因：

- 现阶段不存在必须依赖原生桌面 API 的已确认需求
- backend-hosted web bundle 已满足单机单用户控制台的交付目标
- 在没有签名、更新、崩溃收集和平台支持策略之前，引入桌面壳只会扩大维护面

## Re-entry Criteria

只有在以下任一条件成立时，才重新打开桌面壳实现：

- 明确需要原生托盘、菜单、通知或文件系统深度集成
- 确定要把当前控制台作为离线桌面产品而不是本机 web control plane 分发
- 团队愿意同时承担桌面构建、签名、升级与多平台测试成本
