# NautilusTrader Admin Console Phase 4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把管理控制台从“本地开发可运行的运维台”提升为“统一工作台 + 可交付产物”，覆盖回测/报告集成、工作台整合、前端托管/打包、E2E 与性能硬化。

**Architecture:** 本阶段把 live operations console 与 backtest/report workflows 统一到同一工作台壳层，并确定前端静态资源的最终交付模型。只有在交付模型锁定后，才引入 Playwright、安装包和可选桌面壳评估；仍然坚持单机单用户是默认形态。

**Tech Stack:** FastAPI, Pydantic, pytest, React 19, TypeScript, Vite, TanStack Router, TanStack Query, Playwright, GitHub Actions, optional Tauri spike

---

## Umbrella Issue Structure

推荐 issue 结构：

- Umbrella: `Phase 4: unified workbench and delivery hardening`
- Child A: `Phase 4A: backtest and report integration`
- Child B: `Phase 4B: unified workbench navigation and workspace model`
- Child C: `Phase 4C: frontend hosting, packaging, E2E, and delivery hardening`

## Issue-To-Task Mapping

- Umbrella issue `#12`
  - 负责 phase 级收尾，不承载具体功能实现
  - 关闭条件：`#22`、`#23`、`#24` 已合并，truth docs / memory 已更新，phase 验证命令全部通过
- Child issue `#22`
  - 对应 Task 1
  - 负责 backtest / reports contracts 与页面
- Child issue `#23`
  - 对应 Task 2
  - 负责 unified workbench shell 与 workspace model
- Child issue `#24`
  - 对应 Task 3
  - 负责 frontend delivery model、E2E、CI hardening、desktop evaluation
- Task 4
  - 不单独拆 child issue
  - 作为 umbrella issue `#12` 的 phase close-out gate 执行

## Scope

本阶段允许实现：

- backtest / reports 接入同一工作台
- 统一导航与 workspace model
- 前端静态资源托管方案落定
- Playwright E2E
- 性能预算与前端监控
- 可选 Tauri 评估

本阶段不要求：

- 多用户 SaaS 化
- 远程部署控制平面

## What Already Exists

- `Phase 3` 已具备 live operations 和 diagnostics surfaces
- `crates/backtest`、`crates/analysis`、`nautilus_trader/backtest` 已提供 backtest/report 基础能力
- `.github/workflows/build.yml` 已作为前端 CI 接入面

### Task 1: Add Backtest And Report Contracts To The Admin Surface

**Files:**

- Create: `nautilus_trader/admin/services/backtests.py`
- Create: `nautilus_trader/admin/services/reports.py`
- Modify: `nautilus_trader/admin/schemas.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `tests/unit_tests/admin/test_backtests_api.py`
- Create: `tests/unit_tests/admin/test_reports_api.py`
- Create: `apps/admin-web/src/features/backtests/backtests-page.tsx`
- Create: `apps/admin-web/src/features/reports/reports-page.tsx`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_backtests_endpoint_returns_task_payload():
    client = TestClient(create_admin_app())

    response = client.get("/api/admin/backtests")

    assert response.status_code == 200
    assert "items" in response.json()
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_backtests_api.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 增加 backtest task / result / report summary DTO
- 接入统一工作台导航
- 先做任务浏览和结果查看，不在本阶段扩展复杂策略编辑器

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_backtests_api.py tests/unit_tests/admin/test_reports_api.py -v`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin apps/admin-web
git commit -m "feat: add backtest and report workbench surfaces"
```

### Task 2: Introduce The Unified Workbench Shell And Workspace Model

**Files:**

- Create: `apps/admin-web/src/app/layouts/workbench-shell.tsx`
- Create: `apps/admin-web/src/shared/workspaces/workspace-store.ts`
- Modify: `apps/admin-web/src/app/router.tsx`
- Modify: `apps/admin-web/src/app/layouts/console-shell.tsx`
- Create: `apps/admin-web/src/test/workbench-shell.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";

import { WorkbenchShell } from "../app/layouts/workbench-shell";


test("renders live and analysis workbench entry points", () => {
  render(<WorkbenchShell />);
  expect(screen.getByRole("link", { name: "Operations" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Analysis" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run src/test/workbench-shell.test.tsx`
Expected: FAIL because the shell does not exist

**Step 3: Write minimal implementation**

- 合并 live operations 与 analysis surfaces 的导航层
- 引入本地 workspace model（保存视图布局、过滤器和最近访问）
- 仍然保持单用户本地存储模型

**Step 4: Run verification**

Run: `cd apps/admin-web && npm test -- --run src/test/workbench-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: add unified admin workbench shell"
```

### Task 3: Lock The Delivery Model, Add E2E Coverage, And Evaluate Desktop Packaging

**Files:**

- Create: `nautilus_trader/admin/static/__init__.py`
- Modify: `nautilus_trader/admin/app.py`
- Create: `apps/admin-web/playwright.config.ts`
- Create: `apps/admin-web/tests/e2e/overview.spec.ts`
- Create: `apps/admin-web/tests/e2e/operations.spec.ts`
- Modify: `.github/workflows/build.yml`
- Create: `docs/plans/2026-03-23-nautilustrader-admin-console-desktop-evaluation.md`
- Create: `tests/unit_tests/admin/test_static_hosting.py`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_static_frontend_assets_are_served():
    client = TestClient(create_admin_app())

    response = client.get("/")

    assert response.status_code == 200
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_static_hosting.py -v`
Expected: FAIL because the backend does not yet host built frontend assets

**Step 3: Write minimal implementation**

- 选定最终静态资源交付模型
- 后端托管已构建前端产物，或明确独立分发方案
- 加入 Playwright smoke coverage
- 在文档中单独记录 Tauri 是否值得进入后续实现

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_static_hosting.py -v`
Expected: PASS

Run: `cd apps/admin-web && npx playwright test`
Expected: PASS

Run: `powershell -File scripts/check-governance.ps1`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin apps/admin-web .github/workflows/build.yml docs/plans tests/unit_tests/admin
git commit -m "feat: harden admin workbench delivery and e2e coverage"
```

### Task 4: Close The Phase 4 Governance Loop

**Files:**

- Modify: `docs/system-truth/architecture.md`
- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `docs/system-truth/integrations.md`
- Modify: `memory/active-context.md`
- Modify: `memory/issue-ledger.md`

**Step 1: Run the failing validation**

Run: `powershell -File scripts/check-governance.ps1`
Expected: FAIL or remain incomplete until the delivery model is documented

**Step 2: Implement the minimal integration**

- 写清统一工作台与前端交付模型
- 记录是否进入桌面壳实现

**Step 3: Run verification**

Run: `powershell -File scripts/check-governance.ps1`
Expected: PASS

Run: `pytest tests/unit_tests/admin -v`
Expected: PASS

Run: `cd apps/admin-web && npm test -- --run && npm run build && npx playwright test`
Expected: PASS

**Step 4: Commit**

```bash
git add docs/system-truth memory
git commit -m "docs: finalize phase 4 workbench and delivery planning state"
```

## Success Criteria

- live operations 与 analysis 进入同一 workbench
- 前端交付模型被明确且可验证
- E2E、性能与监控不再停留在文档层
- 是否采用 Tauri 有明确结论而不是悬而未决

## Phase Exit Gate

只有同时满足以下条件，umbrella issue `#12` 才能关闭：

- `#22`、`#23`、`#24` 均已通过 PR 合并
- `docs/system-truth/*` 与 `memory/*` 已按 Task 4 更新
- `pytest tests/unit_tests/admin -v` 通过
- `cd apps/admin-web && npm test -- --run` 通过
- `cd apps/admin-web && npm run build` 通过
- `cd apps/admin-web && npx playwright test` 通过
- 前端最终交付模型与 Tauri 结论都已文档化
