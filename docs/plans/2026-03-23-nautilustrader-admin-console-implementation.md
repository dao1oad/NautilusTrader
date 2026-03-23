# NautilusTrader 管理 UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `NautilusTrader` 建立本机单人使用的 `localhost` 管理控制台，包括管理 API、实时事件流和前端运维工作台基础能力。

**Architecture:** 采用独立 `React 19 + Vite` 前端与 Python 管理 API 双层结构。前端只依赖 admin DTO 和 WebSocket 事件流；后端桥接现有 `live`、`execution`、`portfolio`、`risk`、`persistence` 模块，提供快照、事件和控制命令。

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui, AG Grid, Lightweight Charts, FastAPI, WebSocket, pytest, Vitest, Playwright

---

### Task 1: 建立管理 API 基础骨架

**Files:**
- Create: `nautilus_trader/admin/__init__.py`
- Create: `nautilus_trader/admin/app.py`
- Create: `nautilus_trader/admin/schemas.py`
- Create: `nautilus_trader/admin/services/__init__.py`
- Create: `tests/unit_tests/admin/test_app.py`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_health_endpoint_returns_ok():
    client = TestClient(create_admin_app())
    response = client.get("/api/admin/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_app.py -v`
Expected: FAIL with `ModuleNotFoundError` or `create_admin_app` missing

**Step 3: Write minimal implementation**

```python
from fastapi import FastAPI


def create_admin_app() -> FastAPI:
    app = FastAPI()

    @app.get("/api/admin/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/unit_tests/admin/test_app.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin/test_app.py
git commit -m "feat: scaffold admin api app"
```

### Task 2: 定义管理 DTO 与快照接口

**Files:**
- Create: `nautilus_trader/admin/schemas.py`
- Create: `nautilus_trader/admin/services/snapshots.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_snapshots.py`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_overview_snapshot_has_required_sections():
    client = TestClient(create_admin_app())
    response = client.get("/api/admin/overview")

    assert response.status_code == 200
    payload = response.json()
    assert "node" in payload
    assert "strategies" in payload
    assert "adapters" in payload
    assert "accounts" in payload
    assert "positions" in payload
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_snapshots.py -v`
Expected: FAIL with `404` or missing route

**Step 3: Write minimal implementation**

```python
from pydantic import BaseModel


class OverviewSnapshot(BaseModel):
    node: dict
    strategies: list[dict]
    adapters: list[dict]
    accounts: list[dict]
    positions: list[dict]
```

```python
def build_overview_snapshot() -> dict:
    return {
        "node": {"status": "unknown"},
        "strategies": [],
        "adapters": [],
        "accounts": [],
        "positions": [],
    }
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/unit_tests/admin/test_snapshots.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin/test_snapshots.py
git commit -m "feat: add admin overview snapshot contract"
```

### Task 3: 建立 WebSocket 事件总线

**Files:**
- Create: `nautilus_trader/admin/ws.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_ws.py`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_ws_accepts_subscription():
    client = TestClient(create_admin_app())
    with client.websocket_connect("/ws/admin/events") as websocket:
        websocket.send_json({"type": "subscribe", "channels": ["overview"]})
        payload = websocket.receive_json()

    assert payload["type"] == "subscribed"
    assert payload["channels"] == ["overview"]
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_ws.py -v`
Expected: FAIL because WebSocket route does not exist

**Step 3: Write minimal implementation**

```python
from fastapi import WebSocket


@app.websocket("/ws/admin/events")
async def admin_events(websocket: WebSocket) -> None:
    await websocket.accept()
    message = await websocket.receive_json()
    await websocket.send_json(
        {"type": "subscribed", "channels": message["channels"]},
    )
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/unit_tests/admin/test_ws.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin/test_ws.py
git commit -m "feat: add admin websocket event channel"
```

### Task 4: 脚手架前端工程

**Files:**
- Create: `apps/admin-web/package.json`
- Create: `apps/admin-web/vite.config.ts`
- Create: `apps/admin-web/src/main.tsx`
- Create: `apps/admin-web/src/app/router.tsx`
- Create: `apps/admin-web/src/app/layout.tsx`
- Create: `apps/admin-web/src/app/routes/overview.tsx`
- Create: `apps/admin-web/src/styles.css`
- Create: `apps/admin-web/src/test/overview.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";

import { OverviewRoute } from "../app/routes/overview";


test("renders overview heading", () => {
  render(<OverviewRoute />);
  expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run`
Expected: FAIL because app files do not exist

**Step 3: Write minimal implementation**

```tsx
export function OverviewRoute() {
  return <h1>Overview</h1>;
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: scaffold admin web app"
```

### Task 5: 实现 Overview 与全局连接状态

**Files:**
- Create: `apps/admin-web/src/shared/api/client.ts`
- Create: `apps/admin-web/src/shared/types/admin.ts`
- Create: `apps/admin-web/src/features/overview/overview-page.tsx`
- Create: `apps/admin-web/src/features/connection/connection-indicator.tsx`
- Modify: `apps/admin-web/src/app/routes/overview.tsx`
- Create: `apps/admin-web/src/test/connection-indicator.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";

import { ConnectionIndicator } from "../features/connection/connection-indicator";


test("shows disconnected state", () => {
  render(<ConnectionIndicator status="disconnected" />);
  expect(screen.getByText("Disconnected")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run`
Expected: FAIL because component does not exist

**Step 3: Write minimal implementation**

```tsx
type Props = { status: "connected" | "connecting" | "disconnected" };

export function ConnectionIndicator({ status }: Props) {
  return <span>{status === "disconnected" ? "Disconnected" : status}</span>;
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: add overview shell and connection indicator"
```

### Task 6: 构建只读运维页面

**Files:**
- Create: `apps/admin-web/src/app/routes/nodes.tsx`
- Create: `apps/admin-web/src/app/routes/strategies.tsx`
- Create: `apps/admin-web/src/app/routes/adapters.tsx`
- Create: `apps/admin-web/src/app/routes/orders.tsx`
- Create: `apps/admin-web/src/app/routes/positions.tsx`
- Create: `apps/admin-web/src/app/routes/accounts.tsx`
- Create: `apps/admin-web/src/app/routes/logs.tsx`
- Create: `apps/admin-web/src/features/orders/orders-grid.tsx`
- Create: `apps/admin-web/src/features/logs/log-stream.tsx`
- Create: `apps/admin-web/src/test/orders-grid.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";

import { OrdersGrid } from "../features/orders/orders-grid";


test("renders order id column", () => {
  render(<OrdersGrid rows={[]} />);
  expect(screen.getByText("Order ID")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run`
Expected: FAIL because grid component does not exist

**Step 3: Write minimal implementation**

```tsx
type OrderRow = { orderId: string };

export function OrdersGrid({ rows }: { rows: OrderRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.orderId}>
            <td>{row.orderId}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: add read-only operations views"
```

### Task 7: 实现控制命令通路

**Files:**
- Create: `nautilus_trader/admin/services/commands.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_commands.py`
- Create: `apps/admin-web/src/features/strategies/strategy-actions.tsx`
- Create: `apps/admin-web/src/test/strategy-actions.test.tsx`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_strategy_start_command_returns_accepted():
    client = TestClient(create_admin_app())
    response = client.post("/api/admin/strategies/demo:start")

    assert response.status_code == 202
    assert response.json()["status"] == "accepted"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_commands.py -v`
Expected: FAIL because command route does not exist

**Step 3: Write minimal implementation**

```python
@app.post("/api/admin/strategies/{strategy_id}:start", status_code=202)
def start_strategy(strategy_id: str) -> dict[str, str]:
    return {"status": "accepted", "strategy_id": strategy_id}
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/unit_tests/admin/test_commands.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin apps/admin-web tests/unit_tests/admin/test_commands.py
git commit -m "feat: add strategy command endpoints and actions"
```

### Task 8: 加入风控、告警与审计

**Files:**
- Create: `nautilus_trader/admin/services/audit.py`
- Create: `nautilus_trader/admin/services/alerts.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Create: `tests/unit_tests/admin/test_audit.py`
- Create: `apps/admin-web/src/app/routes/risk.tsx`
- Create: `apps/admin-web/src/features/alerts/alerts-panel.tsx`
- Create: `apps/admin-web/src/features/audit/audit-log.tsx`

**Step 1: Write the failing test**

```python
from nautilus_trader.admin.services.audit import record_command


def test_record_command_returns_audit_event():
    event = record_command("strategy.start", {"strategy_id": "demo"})
    assert event["command"] == "strategy.start"
    assert event["payload"]["strategy_id"] == "demo"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_audit.py -v`
Expected: FAIL because audit service does not exist

**Step 3: Write minimal implementation**

```python
def record_command(command: str, payload: dict) -> dict:
    return {"command": command, "payload": payload}
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/unit_tests/admin/test_audit.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin apps/admin-web tests/unit_tests/admin/test_audit.py
git commit -m "feat: add alerts and audit foundation"
```

### Task 9: 建立端到端验收与文档闭环

**Files:**
- Create: `apps/admin-web/playwright.config.ts`
- Create: `apps/admin-web/tests/e2e/overview.spec.ts`
- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `docs/system-truth/module-boundaries.md`
- Modify: `memory/active-context.md`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("overview page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npx playwright test`
Expected: FAIL because app server or route wiring is incomplete

**Step 3: Write minimal implementation**

```ts
test.use({ baseURL: "http://127.0.0.1:5173" });
```

并补齐启动脚本、路由和文档中的控制面真值说明。

**Step 4: Run test to verify it passes**

Run: `cd apps/admin-web && npx playwright test`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web docs/system-truth memory/active-context.md
git commit -m "test: add admin console e2e coverage"
```

### Task 10: 推进后续阶段

**Files:**
- Modify: `docs/plans/2026-03-23-nautilustrader-admin-console-design.md`
- Modify: `docs/plans/2026-03-23-nautilustrader-admin-console-implementation.md`

**Step 1: Phase 4-8 细化**

Run: 更新设计与实施计划，把交易运维面、数据诊断面、高级运维面、统一工作台和交付硬化拆成后续独立计划
Expected: 文档把后续阶段拆成独立 issue / PR / 子计划

**Step 2: Run docs review**

Run: 通读设计与计划文档，检查是否存在未映射的生产路径与缺失测试
Expected: 没有遗漏核心能力域

**Step 3: Commit**

```bash
git add docs/plans
git commit -m "docs: refine admin console roadmap phases"
```
