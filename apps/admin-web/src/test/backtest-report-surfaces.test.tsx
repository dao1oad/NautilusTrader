import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { BacktestsPage } from "../features/backtests/backtests-page";
import { ReportsPage } from "../features/reports/reports-page";


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


test("renders backtest tasks with task status and report linkage", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T09:03:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          task_id: "BT-20260327-01",
          run_id: "RUN-20260327-EMA-01",
          strategy_id: "ema-cross-btc",
          catalog_id: "primary-parquet",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          status: "completed",
          requested_at: "2026-03-27T08:05:00Z",
          started_at: "2026-03-27T08:06:00Z",
          finished_at: "2026-03-27T08:11:00Z",
          progress_pct: 100,
          report_id: "REP-20260327-01",
          result_summary: "Completed 5,842 bars with net PnL +1240.50 USDT and generated report REP-20260327-01."
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<BacktestsPage />);

  expect(await screen.findByRole("heading", { name: "Backtests" })).toBeInTheDocument();
  expect(await screen.findByText("BT-20260327-01")).toBeInTheDocument();
  expect(await screen.findByText("REP-20260327-01")).toBeInTheDocument();
  expect(await screen.findByText("Completed 5,842 bars with net PnL +1240.50 USDT and generated report REP-20260327-01.")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/backtests?limit=100");
});


test("renders report summaries with key performance metrics", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T09:03:00Z",
      limit: 100,
      partial: false,
      items: [
        {
          report_id: "REP-20260327-01",
          run_id: "RUN-20260327-EMA-01",
          strategy_id: "ema-cross-btc",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          generated_at: "2026-03-27T08:12:00Z",
          net_pnl: "+1240.50 USDT",
          return_pct: "+3.8%",
          max_drawdown: "-0.9%",
          sharpe_ratio: "1.84",
          win_rate: "58%",
          artifacts: ["orders", "fills", "positions", "account"],
          summary: "Orders, fills, positions, and account reports are ready for operator review."
        }
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<ReportsPage />);

  expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
  expect(await screen.findByText("REP-20260327-01")).toBeInTheDocument();
  expect(await screen.findByText("+1240.50 USDT")).toBeInTheDocument();
  expect(await screen.findByText("Orders, fills, positions, and account reports are ready for operator review.")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/reports?limit=100");
});
