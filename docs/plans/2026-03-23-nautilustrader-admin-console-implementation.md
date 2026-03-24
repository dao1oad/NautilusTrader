# NautilusTrader 管理控制台 Phase 0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 围绕 GitHub issue `#8` 交付第一个可合并的管理控制台垂直切片：typed backend overview contract + minimal frontend overview shell。

**Architecture:** 后端在 `nautilus_trader/admin` 内新增独立 control plane，只包装既有 `live`、`execution`、`portfolio`、`risk`、`persistence` 运行时能力；前端在 `apps/admin-web` 内只消费 admin DTO，不接触内部 domain object。`Phase 0` 只承诺开发态双进程运行，不解决打包发行。

**Tech Stack:** FastAPI, Pydantic, pytest, React 19, TypeScript, Vite, Vitest, Testing Library, GitHub Actions

---

## Scope Of This Plan

本计划只覆盖 issue `#8`，并且必须拆成多个有界 PR 顺序执行。

允许实现的内容：

- admin backend scaffold
- typed overview DTO 与只读快照服务
- 最小 WebSocket 契约
- 单页 `Overview` 前端
- stale / disconnected / error / empty 状态
- truth docs、`ops/doc-truth-map.yaml`、CI、`memory/*` 同步

不允许在本计划内实现：

- 策略控制命令
- 多页面路由系统
- 大型表格或图表依赖
- Playwright
- 前端静态资源打包进 wheel

## What Already Exists

- `nautilus_trader/live/node.py`
  - 可复用 node 生命周期与消息流入口
- `nautilus_trader/live/execution_client.py`
  - 可复用 mass status / report 查询能力
- `nautilus_trader/persistence/catalog/base.py`
  - 可复用 catalog 查询抽象
- `tests/unit_tests/live/**`
  - 可参考已有 runtime fake / stub 组织方式
- `tests/unit_tests/persistence/**`
  - 可复用 persistence fixture 思路
- `.github/workflows/build.yml`
  - 作为 admin-web CI 接入面，避免新增独立 workflow

## Ordered PR Slices

issue `#8` 推荐拆成 4 个顺序 PR：

1. PR Slice A：治理落点 + backend scaffold + health / overview contract
2. PR Slice B：overview snapshot service + WS 最小事件契约
3. PR Slice C：frontend overview shell + stale/error handling
4. PR Slice D：frontend CI、开发命令、文档与 memory 收尾

下面的任务按这个顺序执行，不要跳步。

### Task 1: Reserve The Admin Code Plane And Scaffold The Backend Contract

**Files:**

- Modify: `pyproject.toml`
- Create: `nautilus_trader/admin/__init__.py`
- Create: `nautilus_trader/admin/app.py`
- Create: `nautilus_trader/admin/schemas.py`
- Create: `nautilus_trader/admin/services/__init__.py`
- Create: `tests/unit_tests/admin/test_app.py`
- Modify: `docs/system-truth/architecture.md`
- Modify: `docs/system-truth/module-boundaries.md`
- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `ops/doc-truth-map.yaml`
- Modify: `memory/active-context.md`
- Modify: `memory/issue-ledger.md`

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
Expected: FAIL with `ModuleNotFoundError` or missing `create_admin_app`

**Step 3: Write minimal implementation**

- 在 `pyproject.toml` 中增加 `fastapi`、`uvicorn`，并把 `httpx` 加入测试依赖
- 在 `nautilus_trader/admin/app.py` 中新增 `create_admin_app()`
- 先只注册 `/api/admin/health`
- 在同一 PR 中补齐 truth docs 与 `ops/doc-truth-map.yaml`
- 在 `ops/doc-truth-map.yaml` 中新增 `apps/admin-web/**` 的生产路径规则，占用 `architecture`、`module_boundaries`、`runtime_flows`、`api_contracts`、`data_model`、`integrations`

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_app.py -v`
Expected: PASS

Run: `powershell -File scripts/check-governance.ps1`
Expected: PASS

**Step 5: Commit**

```bash
git add pyproject.toml nautilus_trader/admin tests/unit_tests/admin/test_app.py docs/system-truth ops/doc-truth-map.yaml memory
git commit -m "feat: scaffold admin control plane and truth bindings"
```

### Task 2: Add A Typed Overview Snapshot Contract Backed By Existing Runtime Surfaces

**Files:**

- Modify: `nautilus_trader/admin/schemas.py`
- Create: `nautilus_trader/admin/services/overview.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_overview.py`

**Step 1: Write the failing tests**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_overview_endpoint_returns_typed_empty_state():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/overview")

    assert response.status_code == 200
    payload = response.json()
    assert payload["stale"] is False
    assert payload["partial"] is False
    assert payload["node"]["status"] == "not_configured"
    assert payload["strategies"] == []
    assert payload["adapters"] == []
    assert payload["accounts"] == []
    assert payload["positions"] == []
    assert payload["errors"] == []


def test_overview_endpoint_exposes_partial_failures():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/overview?inject_partial_error=true")

    assert response.status_code == 200
    payload = response.json()
    assert payload["partial"] is True
    assert payload["errors"][0]["section"] == "execution"
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/unit_tests/admin/test_overview.py -v`
Expected: FAIL with `404` or missing fields

**Step 3: Write minimal implementation**

- 在 `schemas.py` 中定义：
  - `OverviewSnapshot`
  - `NodeSummary`
  - `StrategySummary`
  - `AdapterSummary`
  - `AccountSummary`
  - `PositionSummary`
  - `SectionError`
- 在 `services/overview.py` 中实现 `build_overview_snapshot(...)`
- 默认返回 `not_configured` / 空列表，而不是空字典
- 快照服务必须显式支持 `partial` 与 `errors`
- 只包装既有 runtime surfaces，不创建额外 repository / gateway 层

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_overview.py -v`
Expected: PASS

Run: `pytest tests/unit_tests/admin/test_app.py tests/unit_tests/admin/test_overview.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin/test_overview.py
git commit -m "feat: add typed admin overview snapshot contract"
```

### Task 3: Add The Minimal WebSocket Contract For Connection State And Snapshot Invalidation

**Files:**

- Create: `nautilus_trader/admin/ws.py`
- Modify: `nautilus_trader/admin/app.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Create: `tests/unit_tests/admin/test_ws.py`

**Step 1: Write the failing tests**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_ws_accepts_overview_subscription():
    client = TestClient(create_admin_app())

    with client.websocket_connect("/ws/admin/events") as websocket:
        websocket.send_json({"type": "subscribe", "channels": ["overview"]})
        payload = websocket.receive_json()

    assert payload["type"] == "subscribed"
    assert payload["channels"] == ["overview"]


def test_ws_rejects_unknown_channel():
    client = TestClient(create_admin_app())

    with client.websocket_connect("/ws/admin/events") as websocket:
        websocket.send_json({"type": "subscribe", "channels": ["orders"]})
        payload = websocket.receive_json()

    assert payload["type"] == "server.error"
    assert payload["code"] == "unsupported_channel"
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/unit_tests/admin/test_ws.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 只支持 `overview` 频道
- 首批事件类型只允许：
  - `subscribed`
  - `connection.state`
  - `overview.updated`
  - `snapshot.invalidate`
  - `server.error`
- 不要在本 PR 中引入 `order.*`、`fill.*`、`command.*` 事件
- WebSocket 断开时必须让前端能够推导出 disconnected / stale 状态

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_ws.py -v`
Expected: PASS

Run: `pytest tests/unit_tests/admin -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin/test_ws.py
git commit -m "feat: add admin overview websocket contract"
```

### Task 4: Scaffold The Minimal Frontend Overview Shell

**Files:**

- Create: `apps/admin-web/package.json`
- Create: `apps/admin-web/package-lock.json`
- Create: `apps/admin-web/tsconfig.json`
- Create: `apps/admin-web/vite.config.ts`
- Create: `apps/admin-web/src/main.tsx`
- Create: `apps/admin-web/src/app.tsx`
- Create: `apps/admin-web/src/styles.css`
- Create: `apps/admin-web/src/features/overview/overview-page.tsx`
- Create: `apps/admin-web/src/features/connection/connection-banner.tsx`
- Create: `apps/admin-web/src/test/overview-page.test.tsx`
- Create: `apps/admin-web/src/test/connection-banner.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";

import { OverviewPage } from "../features/overview/overview-page";


test("renders overview heading", () => {
  render(<OverviewPage />);
  expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
});
```

```tsx
import { render, screen } from "@testing-library/react";

import { ConnectionBanner } from "../features/connection/connection-banner";


test("shows disconnected state", () => {
  render(<ConnectionBanner state="disconnected" />);
  expect(screen.getByText("Disconnected")).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run`
Expected: FAIL because the app does not exist

**Step 3: Write minimal implementation**

- 只做单页 `Overview`
- 不引入 router、query client、Tailwind、component library
- 使用简单 CSS variables 和单一入口 `src/app.tsx`
- `ConnectionBanner` 必须支持：
  - `connected`
  - `connecting`
  - `disconnected`
  - `stale`

**Step 4: Run verification**

Run: `cd apps/admin-web && npm ci`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: scaffold admin web overview shell"
```

### Task 5: Wire The Frontend To The Admin DTO Contract And Stale-State Behavior

**Files:**

- Create: `apps/admin-web/src/shared/types/admin.ts`
- Create: `apps/admin-web/src/shared/api/admin-client.ts`
- Create: `apps/admin-web/src/shared/realtime/admin-events.ts`
- Modify: `apps/admin-web/src/app.tsx`
- Modify: `apps/admin-web/src/features/overview/overview-page.tsx`
- Create: `apps/admin-web/src/test/app.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";

import { App } from "../app";


test("renders empty overview state from api payload", async () => {
  render(<App />);
  expect(await screen.findByText("No live node configured")).toBeInTheDocument();
});
```

```tsx
import { render, screen } from "@testing-library/react";

import { OverviewPage } from "../features/overview/overview-page";


test("renders stale banner when connection is stale", () => {
  render(<OverviewPage connectionState="stale" snapshot={null} error={null} />);
  expect(screen.getByText("Connection stale")).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/admin-web && npm test -- --run`
Expected: FAIL because data wiring is missing

**Step 3: Write minimal implementation**

- `admin-client.ts` 只负责：
  - `GET /api/admin/health`
  - `GET /api/admin/overview`
- `admin-events.ts` 只负责：
  - 连接状态
  - `overview.updated`
  - `snapshot.invalidate`
- 断开连接后 UI 必须进入 `stale` 或 `disconnected`
- 出现 5xx 时必须显示错误态，不能回退到空白页面

**Step 4: Run verification**

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

Run: `cd apps/admin-web && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: wire admin overview dto and stale state handling"
```

### Task 6: Add Frontend Checks To CI And Close The Phase 0 Documentation Loop

**Files:**

- Modify: `.github/workflows/build.yml`
- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `memory/active-context.md`
- Modify: `memory/issue-ledger.md`

**Step 1: Write the failing validation**

Run: `cd apps/admin-web && npm run lint`
Expected: FAIL until lint script and CI wiring are complete

**Step 2: Implement the minimal integration**

- 在 `apps/admin-web/package.json` 中补齐：
  - `lint`
  - `test`
  - `build`
- 在 `.github/workflows/build.yml` 中新增一个前端 job：
  - checkout
  - setup-node
  - `npm ci`
  - `npm run lint`
  - `npm run test -- --run`
  - `npm run build`
- 不新增独立 workflow 文件，先挂到现有 `build.yml`
- 在 `api-contracts.md` 与 `runtime-flows.md` 中写清 admin API / WS 与开发态双进程流
- 更新 `memory/active-context.md` 和 `memory/issue-ledger.md`，把 `#8` 记为正在推进的真实工作 issue

**Step 3: Run verification**

Run: `cd apps/admin-web && npm run lint`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

Run: `cd apps/admin-web && npm run build`
Expected: PASS

Run: `pytest tests/unit_tests/admin -v`
Expected: PASS

Run: `powershell -File scripts/check-governance.ps1`
Expected: PASS

**Step 4: Commit**

```bash
git add .github/workflows/build.yml apps/admin-web docs/system-truth memory
git commit -m "ci: add admin web checks and finalize phase 0 docs"
```

## Failure Modes To Test Before Calling Issue #8 Complete

每个失败模式都必须至少对应一个测试：

- 无 live node 配置
- 快照局部失败，`partial=true`
- WebSocket 断开，前端显示 stale / disconnected
- 后端 5xx，前端显示错误态
- Overview 数据更新时间过旧

## NOT In Scope

以下内容必须留在后续 issue，不能临时塞进 `#8`：

- 策略控制命令和审计 UI
- `Nodes` / `Strategies` / `Orders` / `Logs` 多页面路由
- AG Grid / Lightweight Charts
- Playwright
- 前端静态资源打包进 wheel
- Tauri 桌面壳

## Follow-On Issues After #8

建议在 `#8` 合并后按顺序补以下 issue：

1. `#9` `Phase 1: admin console read-only operations surfaces`
2. `#10` `Phase 2: admin control commands and audit loop`
3. `#11` `Phase 3: trading operations and diagnostics surfaces`
4. `#12` `Phase 4: unified workbench and delivery hardening`
