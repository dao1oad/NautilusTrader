import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { AccountsPage } from "../features/accounts/accounts-page";
import { LogsPage } from "../features/logs/logs-page";
import { OrdersPage } from "../features/orders/orders-page";
import { PositionsPage } from "../features/positions/positions-page";


function renderWithRuntime(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
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

  expect(await screen.findByRole("heading", { name: "Orders" })).toBeInTheDocument();
  expect(await screen.findByText("O-1001")).toBeInTheDocument();
  expect(screen.getByText("accepted")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/orders?limit=100");
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
