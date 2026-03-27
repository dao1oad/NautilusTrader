import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { OverviewRoutePage } from "../app/routes/overview";
import {
  WorkbenchShellMetaProvider,
  useCurrentWorkbenchShellMeta
} from "../app/workbench-shell-meta";
import { OverviewPage } from "../features/overview/overview-page";
import type { AuditSnapshot, OverviewSnapshot, RiskSnapshot } from "../shared/types/admin";
import { WORKSPACE_STORAGE_KEY } from "../shared/workspaces/workspace-store";


const apiMocks = vi.hoisted(() => ({
  getAuditSnapshot: vi.fn(),
  getOverviewSnapshot: vi.fn(),
  getRiskSnapshot: vi.fn()
}));

vi.mock("../shared/api/admin-client", () => ({
  getAuditSnapshot: apiMocks.getAuditSnapshot,
  getOverviewSnapshot: apiMocks.getOverviewSnapshot,
  getRiskSnapshot: apiMocks.getRiskSnapshot
}));

function createOverviewSnapshot(overrides: Partial<OverviewSnapshot> = {}): OverviewSnapshot {
  return {
    generated_at: "2026-03-28T08:05:00Z",
    stale: false,
    partial: false,
    node: { status: "running", node_id: "node-1" },
    strategies: [
      { strategy_id: "alpha", status: "running" },
      { strategy_id: "beta", status: "stopped" }
    ],
    adapters: [
      { adapter_id: "binance", status: "connected" },
      { adapter_id: "ib", status: "degraded" }
    ],
    accounts: [
      {
        account_id: "ACC-1",
        status: "healthy",
        balances: [],
        exposures: [],
        alerts: []
      }
    ],
    positions: [
      {
        instrument_id: "BTCUSDT-PERP.BINANCE",
        side: "long",
        quantity: "0.50"
      },
      {
        instrument_id: "ETHUSDT-PERP.BINANCE",
        side: "short",
        quantity: "1.25"
      }
    ],
    errors: [],
    ...overrides
  };
}

function createRiskSnapshot(overrides: Partial<RiskSnapshot> = {}): RiskSnapshot {
  return {
    generated_at: "2026-03-28T08:12:00Z",
    partial: false,
    summary: {
      trading_state: "restricted",
      risk_level: "elevated",
      margin_utilization: "68%",
      exposure_utilization: "54%",
      active_alerts: 2,
      blocked_actions: 1
    },
    events: [
      {
        event_id: "risk-1",
        severity: "critical",
        title: "Margin threshold breached",
        message: "Cross-account margin exceeded the configured ceiling.",
        occurred_at: "2026-03-28T08:10:00Z"
      }
    ],
    blocks: [
      {
        block_id: "block-1",
        scope: "orders",
        reason: "Manual guardrail enabled",
        status: "active",
        raised_at: "2026-03-28T08:11:00Z"
      }
    ],
    errors: [],
    ...overrides
  };
}

function createAuditSnapshot(overrides: Partial<AuditSnapshot> = {}): AuditSnapshot {
  return {
    generated_at: "2026-03-28T08:17:00Z",
    partial: false,
    items: [
      {
        sequence_id: 7,
        command_id: "cmd-7",
        command: "strategy.stop",
        target: "strategies/alpha",
        status: "completed",
        payload: {},
        recorded_at: "2026-03-28T08:16:00Z",
        message: "Strategy stopped cleanly.",
        failure: null
      },
      {
        sequence_id: 6,
        command_id: "cmd-6",
        command: "adapter.connect",
        target: "adapters/binance",
        status: "accepted",
        payload: {},
        recorded_at: "2026-03-28T08:15:00Z",
        message: "Adapter connection in progress.",
        failure: null
      }
    ],
    errors: [],
    ...overrides
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
}

function WorkbenchShellMetaProbe() {
  const meta = useCurrentWorkbenchShellMeta();

  return (
    <section>
      <p>{`Page title: ${meta.pageTitle ?? "None"}`}</p>
      <p>{`Workbench copy: ${meta.workbenchCopy ?? "None"}`}</p>
      <p>{`Last updated: ${meta.lastUpdated ?? "None"}`}</p>
      <p>{`Status summary: ${meta.statusSummary ?? "None"}`}</p>
    </section>
  );
}

function renderOverviewRoute(ui: ReactElement) {
  const client = createQueryClient();

  return render(
    <QueryClientProvider client={client}>
      <AdminRuntimeProvider
        value={{
          connectionState: "connected",
          error: null
        }}
      >
        <WorkbenchShellMetaProvider>
          <WorkbenchShellMetaProbe />
          {ui}
        </WorkbenchShellMetaProvider>
      </AdminRuntimeProvider>
    </QueryClientProvider>
  );
}


test("renders runtime summary tiles inside the command center", () => {
  render(
    <OverviewPage
      connectionState="connected"
      snapshot={createOverviewSnapshot()}
    />
  );

  expect(screen.getByRole("heading", { name: "Command center" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Runtime summary" })).toBeInTheDocument();
  expect(screen.getByText("Node status")).toBeInTheDocument();
  expect(screen.getByText("running")).toBeInTheDocument();
  expect(screen.getByText("Active strategies")).toBeInTheDocument();
  expect(screen.getByText("Supervised strategies")).toBeInTheDocument();
});


test("renders stale banner when connection is stale and no overview snapshot is available", () => {
  render(<OverviewPage connectionState="stale" snapshot={null} error={null} />);
  expect(screen.getByText("Connection stale")).toBeInTheDocument();
});


test("renders risk snapshot, recent audit activity, and freshest runtime metadata", async () => {
  apiMocks.getOverviewSnapshot.mockResolvedValue(createOverviewSnapshot());
  apiMocks.getRiskSnapshot.mockResolvedValue(createRiskSnapshot());
  apiMocks.getAuditSnapshot.mockResolvedValue(createAuditSnapshot());

  renderOverviewRoute(<OverviewRoutePage />);

  expect(await screen.findByRole("heading", { name: "Command center" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Risk snapshot" })).toBeInTheDocument();
  expect(screen.getByText("Margin threshold breached")).toBeInTheDocument();
  expect(screen.getByText("Manual guardrail enabled")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
  expect(screen.getByText("strategy.stop")).toBeInTheDocument();
  expect(screen.getByText("strategies/alpha")).toBeInTheDocument();
  expect(
    screen.getByText("Page title: Command center")
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Workbench copy: Runtime posture, risk pressure, and latest control-plane movement at a glance."
    )
  ).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-28T08:17:00Z")).toBeInTheDocument();
});


test("falls back to local recent routes when no audit activity is available", async () => {
  window.localStorage.setItem(
    WORKSPACE_STORAGE_KEY,
    JSON.stringify({
      activeWorkbench: "operations",
      lastRouteByWorkbench: {
        operations: "/risk",
        analysis: "/backtests"
      },
      recentRoutes: [
        {
          to: "/risk",
          label: "Risk Center",
          workbench: "operations",
          visitedAt: "2026-03-28T08:14:00.000Z"
        },
        {
          to: "/catalog",
          label: "Catalog",
          workbench: "analysis",
          visitedAt: "2026-03-28T08:09:00.000Z"
        }
      ],
      routePreferences: {
        "/risk": { filterText: "", layout: "table" },
        "/catalog": { filterText: "", layout: "table" }
      }
    })
  );
  apiMocks.getOverviewSnapshot.mockResolvedValue(createOverviewSnapshot());
  apiMocks.getRiskSnapshot.mockResolvedValue(createRiskSnapshot());
  apiMocks.getAuditSnapshot.mockResolvedValue(createAuditSnapshot({ items: [] }));

  renderOverviewRoute(<OverviewRoutePage />);

  expect(await screen.findByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
  expect(screen.getByText("Risk Center")).toBeInTheDocument();
  expect(screen.getByText("Catalog")).toBeInTheDocument();
  expect(screen.queryByText("strategy.stop")).not.toBeInTheDocument();
});
