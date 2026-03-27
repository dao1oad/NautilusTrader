import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { AccountsPage } from "../features/accounts/accounts-page";
import { FillsPage } from "../features/fills/fills-page";
import { LogsPage } from "../features/logs/logs-page";
import { OrdersPage } from "../features/orders/orders-page";
import { PositionsPage } from "../features/positions/positions-page";
import { AdminListPage } from "../features/read-only/admin-list-page";
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

function renderWithRuntime(ui: ReactElement, client: QueryClient = createQueryClient()) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <AdminRuntimeProvider
          value={{
            connectionState: "connected",
            error: null
          }}
        >
          {ui}
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
  expect(screen.getByText("O-ETH-1")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Filter Blotter rows"), {
    target: { value: "ETHUSDT" }
  });

  expect(await screen.findByText("O-ETH-1")).toBeInTheDocument();
  expect(screen.queryByText("O-BTC-1")).not.toBeInTheDocument();
  expect(screen.getByText("Showing 1-1 of 1 rows")).toBeInTheDocument();
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
  expect(screen.getByText("Showing 1-25 of 26 rows")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Next page" }));

  expect(await screen.findByText("F-26")).toBeInTheDocument();
  expect(screen.queryByText("F-1")).not.toBeInTheDocument();
  expect(screen.getByText("Showing 26-26 of 26 rows")).toBeInTheDocument();
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
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/positions?limit=100");
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

  fireEvent.change(screen.getByLabelText("Filter Positions rows"), {
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
