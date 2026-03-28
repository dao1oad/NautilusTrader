import { render, screen } from "@testing-library/react";

import { App } from "../app";


test("renders empty overview state from api payload", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-23T00:00:00Z",
      stale: false,
      partial: false,
      node: { status: "not_configured", node_id: null },
      strategies: [],
      adapters: [],
      accounts: [],
      positions: [],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  expect(await screen.findByText("No live node configured")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/overview");
});


test("renders fetch error state when admin overview returns 500", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 500
  });

  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  expect(await screen.findByText("Admin request failed with status 500")).toBeInTheDocument();
});


test("renders analysis route copy in the shell runtime strip for catalog", async () => {
  window.history.pushState({}, "", "/catalog");

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T09:03:00Z",
      limit: 100,
      partial: false,
      history_query: {
        catalog_id: "primary-parquet",
        instrument_id: "BTCUSDT-PERP.BINANCE",
        data_type: "bars",
        start_time: "2026-03-27T07:00:00Z",
        end_time: "2026-03-27T09:00:00Z",
        limit: 100,
        returned_rows: 100,
        feedback: "History query capped at 100 rows across the selected 2 hour window."
      },
      items: [
        {
          catalog_id: "primary-parquet",
          instrument_id: "BTCUSDT-PERP.BINANCE",
          data_type: "bars",
          timeframe: "1m",
          status: "ready",
          row_count: 18420,
          first_record_at: "2026-03-26T00:00:00Z",
          last_record_at: "2026-03-27T09:00:00Z"
        }
      ],
      operator_notes: [
        "Large catalog reads are capped by limit and explicit UTC time range before operators fan out deeper analysis."
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  expect((await screen.findAllByRole("heading", { name: "Catalog" })).length).toBeGreaterThan(0);
  expect(await screen.findByText("History query capped at 100 rows across the selected 2 hour window.")).toBeInTheDocument();
  expect(
    screen.getAllByText("Bounded catalog browse windows, query feedback, and operator notes for analysis workbench datasets.")
      .length
  ).toBeGreaterThan(0);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/admin/catalog?limit=100&start_time=2026-03-27T07%3A00%3A00Z&end_time=2026-03-27T09%3A00%3A00Z"
  );

  window.history.pushState({}, "", "/");
});
