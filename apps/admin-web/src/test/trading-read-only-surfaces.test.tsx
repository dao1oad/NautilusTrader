import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { WorkbenchShellMetaProvider, useCurrentWorkbenchShellMeta } from "../app/workbench-shell-meta";
import { AccountsPage } from "../features/accounts/accounts-page";
import { FillsPage } from "../features/fills/fills-page";
import { LogsPage } from "../features/logs/logs-page";
import { OrdersPage } from "../features/orders/orders-page";
import { PositionsPage } from "../features/positions/positions-page";
import { AdminListPage } from "../features/read-only/admin-list-page";
import { RiskPage } from "../features/risk/risk-page";
import { READ_ONLY_DEFAULT_LIMIT } from "../shared/api/admin-client";
import { adminQueryKeys } from "../shared/query/query-client";
import type { AdminListSnapshot } from "../shared/types/admin";


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

function renderWithRuntime(
  ui: ReactElement,
  client: QueryClient = createQueryClient(),
  runtimeValue: { connectionState: "connected" | "stale" | "disconnected"; error: string | null } = {
    connectionState: "connected",
    error: null
  }
) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <AdminRuntimeProvider value={runtimeValue}>
          <WorkbenchShellMetaProvider>
            <WorkbenchShellMetaProbe />
            {ui}
          </WorkbenchShellMetaProvider>
        </AdminRuntimeProvider>
      </QueryClientProvider>
    )
  };
}

type DrillDownRow = {
  row_id: string;
  label: string;
};

function IndexedDrillDownPage() {
  const query = useQuery({
    queryKey: ["admin", "test", "indexed-drill-down"],
    queryFn: async () =>
      ({
        generated_at: "2026-03-27T00:00:00Z",
        limit: 100,
        partial: false,
        items: Array.from({ length: 26 }, (_, index) => ({
          row_id: `row-${index + 1}`,
          label: `Row ${index + 1}`
        })),
        errors: []
      }) satisfies AdminListSnapshot<DrillDownRow> & { limit: number }
  });

  return (
    <AdminListPage
      columns={[
        {
          header: "Label",
          render: (item: DrillDownRow) => item.label
        }
      ]}
      emptyDescription="No rows."
      getRowKey={(item) => item.row_id}
      loadingDescription="Loading indexed rows."
      pagination={{ pageSize: 25 }}
      query={query}
      tableLabel="Indexed rows"
      title="Indexed rows"
      drillDown={{
        title: "Indexed details",
        getButtonLabel: (_item, index, expanded) => `${expanded ? "Hide" : "View"} details for row ${index + 1}`,
        render: (item) => item.label
      }}
    />
  );
}

function BlockingStatePage({ items }: { items: DrillDownRow[] }) {
  const query = useQuery({
    queryKey: ["admin", "test", "blocking-state"],
    queryFn: async () =>
      ({
        generated_at: "2026-03-27T00:00:00Z",
        limit: 100,
        partial: false,
        items,
        errors: []
      }) satisfies AdminListSnapshot<DrillDownRow> & { limit: number }
  });

  return (
    <AdminListPage
      columns={[
        {
          header: "Label",
          render: (item: DrillDownRow) => item.label
        }
      ]}
      emptyDescription="No blocking rows."
      filter={{ getSearchText: (item) => item.label }}
      getRowKey={(item) => item.row_id}
      loadingDescription="Loading blocking rows."
      pagination={{ pageSize: 25 }}
      query={query}
      summary={<p>Blocking summary</p>}
      tableLabel="Blocking rows"
      title="Blocking rows"
      drillDown={{
        title: "Blocking details",
        getButtonLabel: (item, _index, expanded) => `${expanded ? "Hide" : "View"} details for ${item.label}`,
        render: (item) => item.label
      }}
    />
  );
}


test("renders order rows from the orders snapshot", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-25T00:00:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          client_order_id: "O-1001",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          side: "buy",
          quantity: "0.50",
          status: "accepted"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<OrdersPage />);

  expect(await screen.findByRole("heading", { name: "Blotter" })).toBeInTheDocument();
  expect(await screen.findByText("O-1001")).toBeInTheDocument();
  expect(screen.getByText("accepted")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/orders?limit=100");
});


test("filters blotter rows by the operator search term", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T00:00:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          client_order_id: "O-BTC-1",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          side: "buy",
          quantity: "0.50",
          status: "accepted"
        },
        {
          client_order_id: "O-ETH-1",
          instrument_id: "ETHUSDT-PERP.BINANCE",
          side: "sell",
          quantity: "1.25",
          status: "filled"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<OrdersPage />);

  expect(await screen.findByText("O-BTC-1")).toBeInTheDocument();
  expect(screen.getByText("Live snapshot")).toBeInTheDocument();
  expect(
    screen.getByText("Active order flow, execution posture, and recent book activity inside the bounded blotter window.")
  ).toBeInTheDocument();
  expect(screen.getByText("Operator filter")).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText("Filter by order id, instrument, side, quantity, or status")
  ).toBeInTheDocument();
  expect(screen.getByText("O-ETH-1")).toBeInTheDocument();

  fireEvent.change(screen.getByRole("searchbox", { name: "Operator filter" }), {
    target: { value: "ETHUSDT" }
  });

  expect(await screen.findByText("O-ETH-1")).toBeInTheDocument();
  expect(screen.queryByText("O-BTC-1")).not.toBeInTheDocument();
  expect(screen.getByText("Rows 1-1 of 1")).toBeInTheDocument();
});


test("renders the shared terminal table inside a focusable named region", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T00:00:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          client_order_id: "O-BTC-1",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          side: "buy",
          quantity: "0.50",
          status: "accepted"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<OrdersPage />);

  const viewport = await screen.findByRole("region", { name: "Blotter table viewport" });

  expect(viewport).toHaveAttribute("tabindex", "0");
  expect(within(viewport).getByRole("table", { name: "Blotter" })).toBeInTheDocument();
});


test("paginates fill rows inside the bounded snapshot", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T00:00:00Z",
      limit: 100,
      partial: false,
      items: Array.from({ length: 26 }, (_, index) => ({
        fill_id: `F-${index + 1}`,
        client_order_id: `O-${index + 1}`,
        instrument_id: "BTCUSDT-PERP.BINANCE",
        side: index % 2 === 0 ? "buy" : "sell",
        quantity: "0.25",
        price: `${64000 + index}`,
        liquidity_side: "taker",
        timestamp: "2026-03-27T00:00:00Z"
      })),
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<FillsPage />);

  expect(await screen.findByText("F-1")).toBeInTheDocument();
  expect(screen.queryByText("F-26")).not.toBeInTheDocument();
  expect(screen.getByText("Rows 1-25 of 26")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Next page" }));

  expect(await screen.findByText("F-26")).toBeInTheDocument();
  expect(screen.queryByText("F-1")).not.toBeInTheDocument();
  expect(screen.getByText("Rows 26-26 of 26")).toBeInTheDocument();
});


test("renders fill rows from the fills snapshot", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T00:00:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          fill_id: "F-1001",
          client_order_id: "O-1001",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          side: "buy",
          quantity: "0.25",
          price: "64250.5",
          liquidity_side: "taker",
          timestamp: "2026-03-27T00:00:00Z"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<FillsPage />);

  expect(await screen.findByRole("heading", { name: "Fills" })).toBeInTheDocument();
  expect(await screen.findByText("F-1001")).toBeInTheDocument();
  expect(screen.getByText("64250.5")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/fills?limit=100");
});


test("renders an explicit empty state when no positions are reported", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-25T00:00:00Z",
      limit: 100,
      partial: false,
      items: [],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<PositionsPage />);

  expect(await screen.findByText("No positions are currently reported by the admin API.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Positions" })).toBeInTheDocument();
  expect(screen.queryByText("Operator filter")).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/positions?limit=100");
});


test("does not render list chrome when a cached snapshot is stale", async () => {
  renderWithRuntime(<BlockingStatePage items={[{ row_id: "row-1", label: "Row 1" }]} />, createQueryClient(), {
    connectionState: "stale",
    error: null
  });

  expect(await screen.findByText("Showing the last successfully received admin snapshot.")).toBeInTheDocument();
  expect(screen.queryByText("Operator filter")).not.toBeInTheDocument();
  expect(screen.queryByText("Blocking summary")).not.toBeInTheDocument();
  expect(screen.queryByText("Row 1")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "View details for Row 1" })).not.toBeInTheDocument();
});


test("filters positions before rendering the drill-down table", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T00:00:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          position_id: "P-BTC",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          side: "long",
          quantity: "0.25",
          entry_price: "64125.0",
          unrealized_pnl: "125.5",
          realized_pnl: "42.0",
          opened_at: "2026-03-27T00:00:00Z",
          updated_at: "2026-03-27T00:05:00Z"
        },
        {
          position_id: "P-ETH",
          instrument_id: "ETHUSDT-PERP.BINANCE",
          side: "short",
          quantity: "1.0",
          entry_price: "3200.0",
          unrealized_pnl: "-15.0",
          realized_pnl: "8.0",
          opened_at: "2026-03-27T00:10:00Z",
          updated_at: "2026-03-27T00:15:00Z"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<PositionsPage />);

  expect(await screen.findByText("BTCUSDT-PERP.BINANCE")).toBeInTheDocument();
  expect(screen.getByText("ETHUSDT-PERP.BINANCE")).toBeInTheDocument();

  fireEvent.change(screen.getByRole("searchbox", { name: "Operator filter" }), {
    target: { value: "ETHUSDT" }
  });

  expect(await screen.findByText("ETHUSDT-PERP.BINANCE")).toBeInTheDocument();
  expect(screen.queryByText("BTCUSDT-PERP.BINANCE")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "View details for ETHUSDT-PERP.BINANCE" })).toBeInTheDocument();
});


test("shows a position drill-down panel for the selected row", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T00:00:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          position_id: "P-1001",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          side: "long",
          quantity: "0.25",
          entry_price: "64125.0",
          unrealized_pnl: "125.5",
          realized_pnl: "42.0",
          opened_at: "2026-03-27T00:00:00Z",
          updated_at: "2026-03-27T00:05:00Z"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<PositionsPage />);

  const toggleButton = await screen.findByRole("button", { name: "View details for BTCUSDT-PERP.BINANCE" });

  fireEvent.click(toggleButton);

  expect(await screen.findByRole("heading", { name: "Position details" })).toBeInTheDocument();
  expect(screen.getByText("P-1001")).toBeInTheDocument();
  expect(screen.getByText("64125.0")).toBeInTheDocument();
  expect(screen.getByText("125.5")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Hide details for BTCUSDT-PERP.BINANCE" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(screen.queryByRole("button", { name: "View details for BTCUSDT-PERP.BINANCE" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Hide details for BTCUSDT-PERP.BINANCE" }));

  expect(screen.queryByRole("heading", { name: "Position details" })).not.toBeInTheDocument();
});


test("keeps the same position drill-down selected across snapshot refreshes", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-27T00:00:00Z",
        limit: 100,
        partial: false,
        items: [
          {
            position_id: "P-BTC",
            instrument_id: "BTCUSDT-PERP.BINANCE",
            side: "long",
            quantity: "0.25",
            entry_price: "64125.0",
            unrealized_pnl: "125.5",
            realized_pnl: "42.0",
            opened_at: "2026-03-27T00:00:00Z",
            updated_at: "2026-03-27T00:05:00Z"
          },
          {
            position_id: "P-ETH",
            instrument_id: "ETHUSDT-PERP.BINANCE",
            side: "short",
            quantity: "1.0",
            entry_price: "3200.0",
            unrealized_pnl: "-15.0",
            realized_pnl: "8.0",
            opened_at: "2026-03-27T00:10:00Z",
            updated_at: "2026-03-27T00:15:00Z"
          }
        ],
        errors: []
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-27T00:01:00Z",
        limit: 100,
        partial: false,
        items: [
          {
            position_id: "P-ETH",
            instrument_id: "ETHUSDT-PERP.BINANCE",
            side: "short",
            quantity: "1.0",
            entry_price: "3200.0",
            unrealized_pnl: "-15.0",
            realized_pnl: "8.0",
            opened_at: "2026-03-27T00:10:00Z",
            updated_at: "2026-03-27T00:15:00Z"
          },
          {
            position_id: "P-BTC",
            instrument_id: "BTCUSDT-PERP.BINANCE",
            side: "long",
            quantity: "0.25",
            entry_price: "64125.0",
            unrealized_pnl: "125.5",
            realized_pnl: "42.0",
            opened_at: "2026-03-27T00:00:00Z",
            updated_at: "2026-03-27T00:05:00Z"
          }
        ],
        errors: []
      })
    });

  vi.stubGlobal("fetch", fetchMock);

  const { client } = renderWithRuntime(<PositionsPage />);

  fireEvent.click(await screen.findByRole("button", { name: "View details for ETHUSDT-PERP.BINANCE" }));

  expect(await screen.findByRole("heading", { name: "Position details" })).toBeInTheDocument();
  expect(screen.getByText("P-ETH")).toBeInTheDocument();

  await client.invalidateQueries({ queryKey: adminQueryKeys.positions(READ_ONLY_DEFAULT_LIMIT) });

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  expect(screen.getByRole("heading", { name: "Position details" })).toBeInTheDocument();
  expect(screen.getByText("P-ETH")).toBeInTheDocument();
});


test("keeps the same position drill-down selected when snapshots reorder rows without position ids", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-27T00:00:00Z",
        limit: 100,
        partial: false,
        items: [
          {
            instrument_id: "BTCUSDT-PERP.BINANCE",
            side: "long",
            quantity: "0.25",
            entry_price: "64125.0",
            unrealized_pnl: "125.5",
            realized_pnl: "42.0",
            opened_at: "2026-03-27T00:00:00Z",
            updated_at: "2026-03-27T00:05:00Z"
          },
          {
            instrument_id: "ETHUSDT-PERP.BINANCE",
            side: "short",
            quantity: "1.0",
            entry_price: "3200.0",
            unrealized_pnl: "-15.0",
            realized_pnl: "8.0",
            opened_at: "2026-03-27T00:10:00Z",
            updated_at: "2026-03-27T00:15:00Z"
          }
        ],
        errors: []
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-27T00:01:00Z",
        limit: 100,
        partial: false,
        items: [
          {
            instrument_id: "ETHUSDT-PERP.BINANCE",
            side: "short",
            quantity: "1.0",
            entry_price: "3200.0",
            unrealized_pnl: "-15.0",
            realized_pnl: "8.0",
            opened_at: "2026-03-27T00:10:00Z",
            updated_at: "2026-03-27T00:15:00Z"
          },
          {
            instrument_id: "BTCUSDT-PERP.BINANCE",
            side: "long",
            quantity: "0.25",
            entry_price: "64125.0",
            unrealized_pnl: "125.5",
            realized_pnl: "42.0",
            opened_at: "2026-03-27T00:00:00Z",
            updated_at: "2026-03-27T00:05:00Z"
          }
        ],
        errors: []
      })
    });

  vi.stubGlobal("fetch", fetchMock);

  const { client } = renderWithRuntime(<PositionsPage />);

  fireEvent.click(await screen.findByRole("button", { name: "View details for ETHUSDT-PERP.BINANCE" }));

  expect(await screen.findByRole("heading", { name: "Position details" })).toBeInTheDocument();
  expect(screen.getByText("3200.0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Hide details for ETHUSDT-PERP.BINANCE" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await client.invalidateQueries({ queryKey: adminQueryKeys.positions(READ_ONLY_DEFAULT_LIMIT) });

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  expect(screen.getByRole("heading", { name: "Position details" })).toBeInTheDocument();
  expect(screen.getByText("3200.0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Hide details for ETHUSDT-PERP.BINANCE" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});


test("uses absolute row indexes for drill-down labels across paginated snapshots", async () => {
  renderWithRuntime(<IndexedDrillDownPage />);

  expect(await screen.findByRole("button", { name: "View details for row 1" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Next page" }));

  expect(await screen.findByRole("button", { name: "View details for row 26" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "View details for row 1" })).not.toBeInTheDocument();
});


test("surfaces account request failures through the shared page state", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 503
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<AccountsPage />);

  expect(await screen.findByText("Admin request failed with status 503")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/accounts?limit=100");
});


test("renders account summaries and account drill-down details", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T08:58:00Z",
      limit: 100,
      partial: false,
      summary: {
        active_accounts: 2,
        total_equity: "1842500.00",
        available_cash: "905000.00",
        margin_used: "612500.00",
        margin_available: "1140000.00",
        gross_exposure: "4280000.00",
        net_exposure: "1525000.00"
      },
      items: [
        {
          account_id: "BINANCE-UM-FUTURES",
          venue: "BINANCE",
          account_type: "margin",
          status: "healthy",
          base_currency: "USDT",
          total_equity: "1250000.00",
          available_cash: "620000.00",
          margin_used: "430000.00",
          margin_available: "820000.00",
          margin_ratio: "0.34",
          gross_exposure: "3000000.00",
          net_exposure: "950000.00",
          updated_at: "2026-03-27T08:58:00Z",
          balances: [
            { asset: "USDT", total: "900000.00", available: "620000.00", locked: "280000.00" },
            { asset: "BTC", total: "18.40", available: "18.10", locked: "0.30" }
          ],
          exposures: [
            {
              instrument_id: "BTCUSDT-PERP.BINANCE",
              side: "long",
              net_quantity: "12.0",
              notional: "780000.00",
              leverage: "2.4"
            }
          ],
          alerts: ["Margin buffer below target threshold."]
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<AccountsPage />);

  expect(await screen.findByRole("heading", { name: "Accounts" })).toBeInTheDocument();
  expect(await screen.findByText("Total equity")).toBeInTheDocument();
  expect(screen.getByText("Margin available")).toBeInTheDocument();
  expect(screen.getByText("BINANCE-UM-FUTURES")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "View details for BINANCE-UM-FUTURES" }));

  expect(await screen.findByRole("heading", { name: "Account details" })).toBeInTheDocument();
  expect(screen.getByText("Margin buffer below target threshold.")).toBeInTheDocument();
  expect(screen.getByText("BTCUSDT-PERP.BINANCE")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/accounts?limit=100");
});


test("renders risk center summaries, events, and active blocks", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T08:57:00Z",
      partial: false,
      summary: {
        trading_state: "reducing",
        risk_level: "elevated",
        margin_utilization: "0.54",
        exposure_utilization: "0.67",
        active_alerts: 2,
        blocked_actions: 1
      },
      events: [
        {
          event_id: "margin-buffer-warning",
          severity: "warn",
          title: "Margin buffer narrowing",
          message: "BTC book is using 54% of the configured margin budget.",
          occurred_at: "2026-03-27T08:55:00Z"
        }
      ],
      blocks: [
        {
          block_id: "reduce-only-btc",
          scope: "orders/BTCUSDT-PERP.BINANCE",
          reason: "Reduce-only guard enabled while the margin cushion recovers.",
          status: "active",
          raised_at: "2026-03-27T08:57:00Z"
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<RiskPage />);

  expect(await screen.findByRole("heading", { name: "Risk center" })).toBeInTheDocument();
  expect(screen.getByText("Immediate guardrail posture")).toBeInTheDocument();
  expect(await screen.findByText("Trading state")).toBeInTheDocument();
  expect(screen.getByText("Alert stream")).toBeInTheDocument();
  expect(screen.getByText("Hard constraints")).toBeInTheDocument();
  expect(screen.getByText("Margin buffer narrowing")).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Active blocks" })).toBeInTheDocument();
  expect(screen.getByText("Reduce-only guard enabled while the margin cushion recovers.")).toBeInTheDocument();
  expect(screen.getByText("Page title: Risk center")).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-27T08:57:00Z")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/risk");
});


test("shows degraded risk snapshots explicitly", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T09:00:00Z",
      partial: true,
      summary: {
        trading_state: "active",
        risk_level: "monitoring",
        margin_utilization: "0.41",
        exposure_utilization: "0.52",
        active_alerts: 1,
        blocked_actions: 0
      },
      events: [
        {
          event_id: "risk-feed-delay",
          severity: "info",
          title: "One venue delayed",
          message: "Derivatives risk feed is delayed by 12 seconds.",
          occurred_at: "2026-03-27T08:59:00Z"
        }
      ],
      blocks: [],
      errors: [
        {
          section: "risk",
          message: "One venue risk feed is delayed."
        }
      ]
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<RiskPage />);

  expect(await screen.findByRole("heading", { name: "Risk center" })).toBeInTheDocument();
  expect(await screen.findByText("Showing the latest partial snapshot.")).toBeInTheDocument();
  expect(
    screen.getByText((_, element) => element?.tagName === "LI" && element.textContent === "risk: One venue risk feed is delayed.")
  ).toBeInTheDocument();
  expect(screen.getByText("Derivatives risk feed is delayed by 12 seconds.")).toBeInTheDocument();
});


test("shows partial log snapshots explicitly", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-25T00:00:00Z",
      limit: 100,
      partial: true,
      items: [
        {
          timestamp: "2026-03-25T00:00:00Z",
          level: "WARN",
          component: "risk-engine",
          message: "Dropped one log event while the stream was reconnecting."
        }
      ],
      errors: [
        {
          section: "logs",
          message: "Log stream degraded."
        }
      ]
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<LogsPage />);

  expect(await screen.findByRole("heading", { name: "Logs" })).toBeInTheDocument();
  expect(await screen.findByText("Showing the latest partial snapshot.")).toBeInTheDocument();
  expect(screen.getByText("Dropped one log event while the stream was reconnecting.")).toBeInTheDocument();
  expect(
    screen.getByText(
      (_, element) => element?.tagName === "LI" && element.textContent === "logs: Log stream degraded."
    )
  ).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/logs?limit=100");
});
