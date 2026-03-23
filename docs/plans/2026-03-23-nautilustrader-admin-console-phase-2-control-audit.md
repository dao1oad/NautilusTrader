# NautilusTrader Admin Console Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在只读控制台基础上引入低风险控制命令、操作确认、结果回执和本机审计闭环。

**Architecture:** 本阶段继续沿用 `nautilus_trader/admin` 作为唯一控制通道，新增 typed command DTO、命令服务、审计 sink 和前端确认流。所有命令都必须经过显式确认、统一错误码和操作回执；仍然禁止高风险批量交易动作。

**Tech Stack:** FastAPI, Pydantic, pytest, React 19, TypeScript, Vite, TanStack Router, TanStack Query, Vitest, Testing Library

---

## Umbrella Issue Structure

推荐 issue 结构：

- Umbrella: `Phase 2: admin control commands and audit loop`
- Child A: `Phase 2A: command contract, error codes, and audit sink`
- Child B: `Phase 2B: low-risk strategy, adapter, and subscription controls`
- Child C: `Phase 2C: command confirmations, audit timeline, and recovery runbooks`

## Issue-To-Task Mapping

- Umbrella issue `#10`
  - 负责 phase 级收尾，不承载具体功能实现
  - 关闭条件：`#16`、`#17`、`#18` 已合并，truth docs / memory 已更新，phase 验证命令全部通过
- Child issue `#16`
  - 对应 Task 1
  - 负责 typed command contract、error codes、audit records
- Child issue `#17`
  - 对应 Task 2
  - 负责 low-risk backend command endpoints 与 WS receipts
- Child issue `#18`
  - 对应 Task 3
  - 负责 frontend confirmations、audit timeline、config diff / runbook affordances
- Task 4
  - 不单独拆 child issue
  - 作为 umbrella issue `#10` 的 phase close-out gate 执行

## Scope

本阶段允许实现：

- typed command DTO
- low-risk 控制命令：策略启停、适配器连接控制、行情订阅控制
- 显式确认对话
- 命令 accepted / completed / failed 回执
- 本机 append-only 审计记录
- config inspect / diff 只读查看

本阶段不允许实现：

- 批量下单或交易修改
- 高风险不可逆操作
- 团队协作 / 多用户权限
- 桌面交付

## What Already Exists

- `Phase 1` 已有多页面只读控制台
- `Phase 0` 和 `Phase 1` 已建立 admin DTO 与最小实时更新语义
- `nautilus_trader/live/node.py`、`nautilus_trader/live/data_client.py`、`nautilus_trader/live/execution_client.py` 提供可包装的运行时能力

### Task 1: Add Typed Command Contracts, Error Codes, And Audit Records

**Files:**
- Modify: `nautilus_trader/admin/schemas.py`
- Create: `nautilus_trader/admin/services/commands.py`
- Create: `nautilus_trader/admin/services/audit.py`
- Create: `tests/unit_tests/admin/test_commands_schema.py`
- Create: `tests/unit_tests/admin/test_audit_service.py`

**Step 1: Write the failing tests**

```python
from nautilus_trader.admin.services.audit import record_command_event


def test_record_command_event_returns_audit_record():
    record = record_command_event("strategy.start", {"strategy_id": "demo"}, "accepted")

    assert record.command == "strategy.start"
    assert record.status == "accepted"
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/unit_tests/admin/test_audit_service.py -v`
Expected: FAIL because the audit service does not exist

**Step 3: Write minimal implementation**

- 定义 command request / receipt / failure DTO
- 定义统一错误码
- 实现 append-only 本机审计 sink
- 默认只支持本机单人模式，不为 RBAC 做提前抽象

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_commands_schema.py tests/unit_tests/admin/test_audit_service.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin
git commit -m "feat: add admin command contracts and audit sink"
```

### Task 2: Add Backend Command Endpoints For Low-Risk Controls

**Files:**
- Modify: `nautilus_trader/admin/app.py`
- Modify: `nautilus_trader/admin/ws.py`
- Modify: `nautilus_trader/admin/services/commands.py`
- Create: `tests/unit_tests/admin/test_strategy_commands.py`
- Create: `tests/unit_tests/admin/test_adapter_commands.py`
- Create: `tests/unit_tests/admin/test_subscription_commands.py`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from nautilus_trader.admin.app import create_admin_app


def test_strategy_start_command_returns_accepted_receipt():
    client = TestClient(create_admin_app())

    response = client.post("/api/admin/commands/strategies/demo/start")

    assert response.status_code == 202
    assert response.json()["status"] == "accepted"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/unit_tests/admin/test_strategy_commands.py -v`
Expected: FAIL because the route does not exist

**Step 3: Write minimal implementation**

- 为策略启停、适配器连接、行情订阅控制增加 endpoint
- 所有命令返回 typed receipt
- WS 增加 `command.accepted`、`command.completed`、`command.failed`
- 仍然禁止交易类命令

**Step 4: Run verification**

Run: `pytest tests/unit_tests/admin/test_strategy_commands.py tests/unit_tests/admin/test_adapter_commands.py tests/unit_tests/admin/test_subscription_commands.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add nautilus_trader/admin tests/unit_tests/admin
git commit -m "feat: add low-risk admin control endpoints"
```

### Task 3: Add Frontend Confirmations, Command Receipts, And Audit Timeline

**Files:**
- Create: `apps/admin-web/src/features/commands/confirm-command-dialog.tsx`
- Create: `apps/admin-web/src/features/commands/use-command-action.ts`
- Create: `apps/admin-web/src/features/audit/audit-timeline.tsx`
- Create: `apps/admin-web/src/features/config/config-diff-page.tsx`
- Modify: `apps/admin-web/src/features/strategies/strategies-page.tsx`
- Modify: `apps/admin-web/src/features/adapters/adapters-page.tsx`
- Create: `apps/admin-web/src/test/confirm-command-dialog.test.tsx`
- Create: `apps/admin-web/src/test/audit-timeline.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";

import { ConfirmCommandDialog } from "../features/commands/confirm-command-dialog";


test("requires explicit confirmation copy before executing a command", () => {
  render(<ConfirmCommandDialog open commandLabel="Start strategy" />);
  expect(screen.getByText("Start strategy")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/admin-web && npm test -- --run src/test/confirm-command-dialog.test.tsx`
Expected: FAIL because the dialog does not exist

**Step 3: Write minimal implementation**

- 所有命令入口先走确认
- 页面展示 accepted / completed / failed receipt
- 增加审计时间线页面
- 增加 config inspect / diff 只读页面

**Step 4: Run verification**

Run: `cd apps/admin-web && npm test -- --run`
Expected: PASS

Run: `cd apps/admin-web && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web
git commit -m "feat: add admin command confirmations and audit timeline"
```

### Task 4: Close The Phase 2 Governance Loop

**Files:**
- Modify: `docs/system-truth/api-contracts.md`
- Modify: `docs/system-truth/runtime-flows.md`
- Modify: `docs/system-truth/data-model.md`
- Modify: `memory/active-context.md`
- Modify: `memory/issue-ledger.md`

**Step 1: Run the failing validation**

Run: `powershell -File scripts/check-governance.ps1`
Expected: FAIL or remain incomplete until command/audit contracts are reflected in truth docs

**Step 2: Implement the minimal integration**

- 补齐 command receipt / audit record contract
- 记录本阶段新增的风险边界和非范围

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
git commit -m "docs: finalize phase 2 command and audit planning state"
```

## Success Criteria

- 所有控制动作都需要显式确认
- 所有控制动作都有 typed receipt
- 所有控制动作都写入本机审计记录
- 本阶段仍然没有高风险交易命令

## Phase Exit Gate

只有同时满足以下条件，umbrella issue `#10` 才能关闭：

- `#16`、`#17`、`#18` 均已通过 PR 合并
- `docs/system-truth/*` 与 `memory/*` 已按 Task 4 更新
- `pytest tests/unit_tests/admin -v` 通过
- `cd apps/admin-web && npm test -- --run` 通过
- `cd apps/admin-web && npm run build` 通过
- 本阶段没有引入批量交易或高风险不可逆命令
