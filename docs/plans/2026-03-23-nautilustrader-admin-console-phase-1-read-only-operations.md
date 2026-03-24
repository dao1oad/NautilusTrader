# NautilusTrader Admin Console Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `Phase 0` 的 overview 垂直切片之上，交付首个可日常使用的只读运维控制台，包括多页面壳层和 `Nodes / Strategies / Adapters / Orders / Positions / Accounts / Logs` 只读视图。

**Architecture:** 保持 `nautilus_trader/admin` 作为唯一控制面后端，继续以 admin DTO 包装既有 runtime surfaces；前端从单页 overview 扩展为多页面 console shell，引入统一的导航、标准化空态/错误态和只读实时刷新语义。此阶段仍然禁止控制命令，所有页面只做读取和诊断。

**Tech Stack:** FastAPI, Pydantic, pytest, React 19, TypeScript, Vite, TanStack Router, TanStack Query, Vitest, Testing Library

---

## Umbrella Issue Structure

推荐 issue 结构：

- Umbrella: `Phase 1: admin console read-only operations surfaces`
- Child A: `Phase 1A: console shell, routing, and shared page states`
- Child B: `Phase 1B: read-only nodes, strategies, and adapters surfaces`
- Child C: `Phase 1C: read-only orders, positions, accounts, and logs surfaces`

## Issue-To-Task Mapping

- Umbrella issue `#9`
  - 负责 phase 级收尾，不承载具体功能实现
  - 关闭条件：`#13`、`#14`、`#15` 已合并，truth docs / memory 已更新，phase 验证命令全部通过
- Child issue `#13`
  - 对应 Task 1、Task 2
  - 负责 console shell、routing、shared page states、query / invalidation 基座
- Child issue `#14`
  - 对应 Task 3
  - 负责 `Nodes / Strategies / Adapters` 只读 DTO、API 和页面
- Child issue `#15`
  - 对应 Task 4
  - 负责 `Orders / Positions / Accounts / Logs` 只读 DTO、API 和页面
- Task 5
  - 不单独拆 child issue
  - 作为 umbrella issue `#9` 的 phase close-out gate 执行

## Scope

本阶段允许实现：

- 多页面 app shell
- 左侧导航 / 顶部状态栏 / 页面标题体系
- `Nodes`、`Strategies`、`Adapters`、`Orders`、`Positions`、`Accounts`、`Logs` 只读页面
- 统一 loading / empty / error / stale page states
- 面向只读页面的 DTO、REST 和 WS invalidation 语义

本阶段不允许实现：

- 策略启停、适配器重连、订阅控制等命令
- 审计时间线
- AG Grid、Lightweight Charts
- Playwright
- 前端打包与桌面壳

## What Already Exists

- `Phase 0` 已定义 overview DTO、health、overview、最小 WebSocket 契约
- `nautilus_trader/live/node.py` 提供 node 生命周期与消息流入口
- `nautilus_trader/live/execution_client.py` 提供订单/成交/持仓报告能力
- `tests/unit_tests/live/**`、`tests/unit_tests/persistence/**` 可作为 fake / fixture 参考

### Task 1: Introduce The Multi-Page Console Shell

**Files:**

- Create: `apps/admin-web/src/app/router.tsx`
- Create: `apps/admin-web/src/app/layouts/console-shell.tsx`
- Create: `apps/admin-web/src/app/routes/__root.tsx`
- Create: `apps/admin-web/src/app/routes/nodes.tsx`
- Create: `apps/admin-web/src/app/routes/strategies.tsx`
- Create: `apps/admin-web/src/app/routes/adapters.tsx`
- Create: `apps/admin-web/src/app/routes/orders.tsx`
- Create: `apps/admin-web/src/app/routes/positions.tsx`
- Create: `apps/admin-web/src/app/routes/accounts.tsx`
- Create: `apps/admin-web/src/app/routes/logs.tsx`
- Modify: `apps/admin-web/src/main.tsx`
- Modify: `apps/admin-web/src/app.tsx`
- Create: `apps/admin-web/src/test/console-shell.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";

import { ConsoleShell } from "../app/layouts/console-shell";


test("renders navigation entries for read-only operations routes", () => {
  render(<ConsoleShell />);

  expect(screen.getByRole("link", { name: "Nodes" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Strategies" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run src/test/console-shell.test.tsx`
Expected: FAIL because router / shell files do not exist

**Step 3: Write minimal implementation**

- 引入 `TanStack Router`
- 建立统一 `ConsoleShell`
- 保留 `Overview` 并加入新的只读页面导航
- 所有页面先允许渲染占位状态，不提前接命令组件

**Step 4: Run verification**

Run: `cd apps/admin-web && npm test -- --run src/test/console-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: add admin console shell and routes"
```

### Task 2: Add Shared Page States And Realtime Query Infrastructure

**Files:**

- Create: `apps/admin-web/src/shared/query/query-client.ts`
- Create: `apps/admin-web/src/shared/ui/page-state.tsx`
- Create: `apps/admin-web/src/shared/ui/last-updated-badge.tsx`
- Create: `apps/admin-web/src/shared/realtime/invalidation-bus.ts`
- Modify: `apps/admin-web/src/shared/realtime/admin-events.ts`
- Create: `apps/admin-web/src/test/page-state.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";

import { PageState } from "../shared/ui/page-state";


test("renders stale state explicitly", () => {
  render(<PageState kind="stale" title="Connection stale" />);
  expect(screen.getByText("Connection stale")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run src/test/page-state.test.tsx`
Expected: FAIL because the shared page-state component does not exist

**Step 3: Write minimal implementation**

- 引入 `TanStack Query`
- 把 `Phase 0` 的 API client / WS invalidation 改成 query-aware 模式
- 抽出统一 `PageState`
- 统一页面级 `loading` / `empty` / `error` / `stale`

**Step 4: Run verification**

Run: `cd apps/admin-web && npm test -- --run src/test/page-state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: add shared read-only query and page state infrastructure"
```

### Task 3: Add Read-Only Nodes, Strategies, And Adapters APIs And Pages

**Files:**

- Create: `nautilus_trader/admin/services/nodes.py`
- Create: `nautilus_trader/admin/services/strategies.py`
- Create: `nautilus_trader/admin/services/adapters.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_nodes_api.py`
- Create: `tests/unit_tests/admin/test_strategies_api.py`
- Create: `tests/unit_tests/admin/test_adapters_api.py`
- Create: `apps/admin-web/src/features/nodes/nodes-page.tsx`
- Create: `apps/admin-web/src/features/strategies/strategies-page.tsx`
- Create: `apps/admin-web/src/features/adapters/adapters-page.tsx`

**Step 1: Write the failing tests**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_nodes_endpoint_returns_list_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/nodes")

    assert response.status_code == 200
    assert "items" in response.json()
```

```tsx
import { render, screen } from "@testing-library/react";

import { NodesPage } from "../features/nodes/nodes-page";


test("renders nodes heading", () => {
  render(<NodesPage />);
  expect(screen.getByRole("heading", { name: "Nodes" })).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/unit_tests/admin/test_nodes_api.py -v`
Expected: FAIL because the route does not exist

Run: `cd apps/admin-web && npm test -- --run src/features/nodes`
Expected: FAIL because the page does not exist

**Step 3: Write minimal implementation**

- 为 `nodes`、`strategies`、`adapters` 定义只读列表 DTO
- 保持 payload 包含 `items`、`generated_at`、`partial`、`errors`
- 页面先用轻量列表或 table，不引入 AG Grid

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_nodes_api.py tests/unit_tests/admin/test_strategies_api.py tests/unit_tests/admin/test_adapters_api.py -v`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin apps/admin-web
git commit -m "feat: add read-only node strategy adapter surfaces"
```

### Task 4: Add Read-Only Orders, Positions, Accounts, And Logs APIs And Pages

**Files:**

- Create: `nautilus_trader/admin/services/orders.py`
- Create: `nautilus_trader/admin/services/positions.py`
- Create: `nautilus_trader/admin/services/accounts.py`
- Create: `nautilus_trader/admin/services/logs.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_orders_api.py`
- Create: `tests/unit_tests/admin/test_positions_api.py`
- Create: `tests/unit_tests/admin/test_accounts_api.py`
- Create: `tests/unit_tests/admin/test_logs_api.py`
- Create: `apps/admin-web/src/features/orders/orders-page.tsx`
- Create: `apps/admin-web/src/features/positions/positions-page.tsx`
- Create: `apps/admin-web/src/features/accounts/accounts-page.tsx`
- Create: `apps/admin-web/src/features/logs/logs-page.tsx`

**Step 1: Write the failing tests**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_orders_endpoint_returns_list_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/orders")

    assert response.status_code == 200
    assert "items" in response.json()
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/unit_tests/admin/test_orders_api.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 使用既有 execution / portfolio / accounting surfaces 构建只读 DTO
- `logs` 页面先只做聚合和只读查看，不在本阶段接告警确认或过滤保存
- 对大量结果先定义基本分页或 limit，避免无界查询

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_orders_api.py tests/unit_tests/admin/test_positions_api.py tests/unit_tests/admin/test_accounts_api.py tests/unit_tests/admin/test_logs_api.py -v`
Expected: PASS

Run: `cd apps/admin-web && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin apps/admin-web
git commit -m "feat: add read-only trading and logs surfaces"
```

### Task 5: Close The Phase 1 Governance Loop

**Files:**

- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `docs/system-truth/module-boundaries.md`
- Modify: `memory/active-context.md`
- Modify: `memory/issue-ledger.md`

**Step 1: Run the failing validation**

Run: `powershell -File scripts/check-governance.ps1`
Expected: FAIL or remain incomplete until truth docs and memory reflect the new surfaces

**Step 2: Implement the minimal integration**

- 写清新增 read-only endpoints 和前端路由面
- 回写 issue 状态与 phase 状态

**Step 3: Run verification**

Run: `powershell -File scripts/check-governance.ps1`
Expected: PASS

Run: `pytest tests/unit_tests/admin -v`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add docs/system-truth memory
git commit -m "docs: finalize phase 1 read-only operations planning state"
```

## Success Criteria

- 所有只读页面可独立加载
- 页面统一使用 shared page states
- 后端 DTO 与前端 query/invalidation 语义一致
- 本阶段仍然没有任何控制命令入口

## Phase Exit Gate

只有同时满足以下条件，umbrella issue `#9` 才能关闭：

- `#13`、`#14`、`#15` 均已通过 PR 合并
- `docs/system-truth/*` 与 `memory/*` 已按 Task 5 更新
- `pytest tests/unit_tests/admin -v` 通过
- `cd apps/admin-web && npm test -- --run` 通过
- `cd apps/admin-web && npm run build` 通过
- 本阶段没有引入任何控制命令入口
