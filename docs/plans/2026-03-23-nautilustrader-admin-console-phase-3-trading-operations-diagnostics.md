# NautilusTrader Admin Console Phase 3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把控制台扩展为可日常运维的交易与诊断工作台，包括 blotter、position drill-down、账户与风控中心，以及 catalog / history / playback / diagnostics 能力。

**Architecture:** 本阶段把 read-only surfaces 和低风险控制面扩展为高信息密度运维台，重点是 richer DTO、分页查询、时间范围过滤和诊断链路。此阶段允许引入专业表格和图表依赖，但仍保持单机单用户前提，不引入多租户或远程协作。

**Tech Stack:** FastAPI, Pydantic, pytest, React 19, TypeScript, Vite, TanStack Router, TanStack Query, AG Grid, Lightweight Charts, Vitest, Testing Library

---

## Umbrella Issue Structure

推荐 issue 结构：

- Umbrella: `Phase 3: trading operations and diagnostics surfaces`
- Child A: `Phase 3A: blotter, fills, and position drill-down`
- Child B: `Phase 3B: accounts, margin, and risk center`
- Child C: `Phase 3C: catalog, history, event playback, and diagnostics`

## Issue-To-Task Mapping

- Umbrella issue `#11`
  - 负责 phase 级收尾，不承载具体功能实现
  - 关闭条件：`#19`、`#20`、`#21` 已合并，truth docs / memory 已更新，phase 验证命令全部通过
- Child issue `#19`
  - 对应 Task 1
  - 负责 blotter、fills、position drill-down contracts 与页面
- Child issue `#20`
  - 对应 Task 2
  - 负责 accounts、margin、risk center
- Child issue `#21`
  - 对应 Task 3
  - 负责 catalog、history、event playback、diagnostics
- Task 4
  - 不单独拆 child issue
  - 作为 umbrella issue `#11` 的 phase close-out gate 执行

## Scope

本阶段允许实现：

- 深度 blotter / fills / positions 视图
- accounts / margin / risk 页面
- catalog / history query / event playback
- 数据链路与运行态诊断
- 专业表格和图表依赖

本阶段不允许实现：

- 多用户协作
- 桌面壳
- 最终交付打包

## What Already Exists

- `Phase 1` 已交付只读运维台页面结构
- `Phase 2` 已交付命令、确认和审计闭环
- `nautilus_trader/persistence/catalog/base.py` 已提供可查询 catalog 抽象
- `nautilus_trader/live/execution_client.py` 已提供报告聚合入口

### Task 1: Add Blotter, Fills, And Position Drill-Down Contracts

**Files:**

- Create: `nautilus_trader/admin/services/fills.py`
- Modify: `nautilus_trader/admin/services/orders.py`
- Modify: `nautilus_trader/admin/services/positions.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_fills_api.py`
- Create: `apps/admin-web/src/features/fills/fills-page.tsx`
- Modify: `apps/admin-web/src/features/orders/orders-page.tsx`
- Modify: `apps/admin-web/src/features/positions/positions-page.tsx`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_fills_endpoint_returns_paginated_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/fills")

    assert response.status_code == 200
    assert "items" in response.json()
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_fills_api.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 为 orders / fills / positions 增加 richer filter / pagination DTO
- 允许 row drill-down
- 引入 AG Grid 但只限 trading ops 页面

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_fills_api.py -v`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin apps/admin-web
git commit -m "feat: add blotter fills and position drill-down surfaces"
```

### Task 2: Add Accounts, Margin, And Risk Center

**Files:**

- Create: `nautilus_trader/admin/services/risk.py`
- Modify: `nautilus_trader/admin/services/accounts.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_risk_api.py`
- Create: `apps/admin-web/src/features/risk/risk-page.tsx`
- Modify: `apps/admin-web/src/features/accounts/accounts-page.tsx`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_risk_endpoint_returns_summary_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/risk")

    assert response.status_code == 200
    assert "summary" in response.json()
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_risk_api.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 暴露 risk summary / events / blocks
- 暴露 margin、balances、exposure 摘要
- 增加风险中心页面和账户 drill-down

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_risk_api.py -v`
Expected: PASS

Run: `cd apps/admin-web && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin apps/admin-web
git commit -m "feat: add accounts margin and risk center"
```

### Task 3: Add Catalog, History, Event Playback, And Diagnostics

**Files:**

- Create: `nautilus_trader/admin/services/catalog.py`
- Create: `nautilus_trader/admin/services/diagnostics.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_catalog_api.py`
- Create: `tests/unit_tests/admin/test_diagnostics_api.py`
- Create: `apps/admin-web/src/features/catalog/catalog-page.tsx`
- Create: `apps/admin-web/src/features/diagnostics/diagnostics-page.tsx`
- Create: `apps/admin-web/src/features/playback/playback-page.tsx`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_catalog_endpoint_returns_query_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/catalog")

    assert response.status_code == 200
    assert "items" in response.json()
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_catalog_api.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 增加 catalog browse / history query / playback request DTO
- 增加 diagnostics summary、link health、query timing
- 为大查询定义 limit、time range 和 operator feedback
- 仅在此阶段引入 Lightweight Charts

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_catalog_api.py tests/unit_tests/admin/test_diagnostics_api.py -v`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin apps/admin-web
git commit -m "feat: add catalog playback and diagnostics surfaces"
```

### Task 4: Close The Phase 3 Governance Loop

**Files:**

- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `docs/system-truth/data-model.md`
- Modify: `docs/system-truth/integrations.md`
- Modify: `memory/active-context.md`
- Modify: `memory/issue-ledger.md`

**Step 1: Run the failing validation**

Run: `powershell -File scripts/check-governance.ps1`
Expected: FAIL or remain incomplete until diagnostics and history contracts are reflected

**Step 2: Implement the minimal integration**

- 补齐 richer query contracts
- 写清 diagnostics / playback 的 operator-visible failure modes

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
git commit -m "docs: finalize phase 3 trading operations planning state"
```

## Success Criteria

- blotter / fills / positions / accounts / risk 页面具备日常运维可用性
- catalog / history / diagnostics 具备明确查询边界
- 大查询和慢查询不会静默卡死 UI

## Phase Exit Gate

只有同时满足以下条件，umbrella issue `#11` 才能关闭：

- `#19`、`#20`、`#21` 均已通过 PR 合并
- `docs/system-truth/*` 与 `memory/*` 已按 Task 4 更新
- `pytest tests/unit_tests/admin -v` 通过
- `cd apps/admin-web && npm test -- --run` 通过
- `cd apps/admin-web && npm run build` 通过
- 大查询、慢查询和诊断失败路径都有 operator-visible feedback
