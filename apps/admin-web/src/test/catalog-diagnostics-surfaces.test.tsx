import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { WorkbenchShellMetaProvider, useCurrentWorkbenchShellMeta } from "../app/workbench-shell-meta";
import { CatalogPage } from "../features/catalog/catalog-page";
import { DiagnosticsPage } from "../features/diagnostics/diagnostics-page";
import { PlaybackPage } from "../features/playback/playback-page";


vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => ({
    addLineSeries: vi.fn(() => ({
      setData: vi.fn()
    })),
    remove: vi.fn()
  }))
}));


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


function renderWithRuntime(ui: ReactElement, client: QueryClient = createQueryClient()) {
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


test("renders catalog browse results with bounded history feedback", async () => {
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

  renderWithRuntime(<CatalogPage />);

  expect(await screen.findByRole("heading", { name: "Catalog" })).toBeInTheDocument();
  expect(await screen.findByText("History query capped at 100 rows across the selected 2 hour window.")).toBeInTheDocument();
  expect(screen.getByText("Analysis workbench")).toBeInTheDocument();
  expect(
    await screen.findByText(
      "Large catalog reads are capped by limit and explicit UTC time range before operators fan out deeper analysis."
    )
  ).toBeInTheDocument();
  expect(
    screen.getByText("Bounded catalog browse windows, query feedback, and operator notes for analysis workbench datasets.")
  ).toBeInTheDocument();
  expect(screen.getByText("Page title: Catalog")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Workbench copy: Bounded catalog browse windows, query feedback, and operator notes for analysis workbench datasets."
    )
  ).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-27T09:03:00Z")).toBeInTheDocument();
  expect((await screen.findAllByText("BTCUSDT-PERP.BINANCE")).length).toBeGreaterThan(0);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/admin/catalog?limit=100&start_time=2026-03-27T07%3A00%3A00Z&end_time=2026-03-27T09%3A00%3A00Z"
  );
});


test("renders playback request details and projected events", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T09:03:00Z",
      partial: false,
      request: {
        request_id: "PB-20260327-01",
        catalog_id: "primary-parquet",
        instrument_id: "BTCUSDT-PERP.BINANCE",
        start_time: "2026-03-27T07:30:00Z",
        end_time: "2026-03-27T08:00:00Z",
        limit: 100,
        speed: "25x",
        event_types: ["bars", "fills", "risk_events"],
        feedback: "Playback preview is capped at 100 projected events across the selected 30 minute window."
      },
      timeline: [
        {
          timestamp: "2026-03-27T07:30:00Z",
          mid_price: "64120.0",
          cumulative_events: 8
        }
      ],
      events: [
        {
          timestamp: "2026-03-27T07:31:00Z",
          event_type: "fill",
          summary: "BTC taker buy fill matched against the replay stream."
        }
      ],
      operator_notes: [
        "Replay requests stay within a bounded UTC window and projected event limit before operators run a full playback job."
      ],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<PlaybackPage />);

  expect(await screen.findByRole("heading", { name: "Playback" })).toBeInTheDocument();
  expect((await screen.findAllByText("PB-20260327-01")).length).toBeGreaterThan(0);
  expect(await screen.findByText("Playback preview is capped at 100 projected events across the selected 30 minute window.")).toBeInTheDocument();
  expect(await screen.findByText("BTC taker buy fill matched against the replay stream.")).toBeInTheDocument();
  expect(screen.getByText("Analysis workbench")).toBeInTheDocument();
  expect(
    screen.getByText("Bounded replay request, preview chart, and projected event stream for the selected analysis window.")
  ).toBeInTheDocument();
  expect(screen.getByText("Page title: Playback")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Workbench copy: Bounded replay request, preview chart, and projected event stream for the selected analysis window."
    )
  ).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-27T09:03:00Z")).toBeInTheDocument();
  expect(screen.getByLabelText("Playback preview chart")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/admin/playback?limit=100&start_time=2026-03-27T07%3A30%3A00Z&end_time=2026-03-27T08%3A00%3A00Z"
  );
});


test("surfaces diagnostics partial errors explicitly", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-27T09:03:00Z",
      partial: true,
      summary: {
        overall_status: "partial",
        healthy_links: 1,
        degraded_links: 2,
        slow_queries: 1,
        latest_catalog_sync_at: "2026-03-27T09:01:00Z"
      },
      links: [
        {
          link_id: "catalog-primary",
          label: "Primary parquet catalog",
          status: "degraded",
          latency_ms: 480,
          last_checked_at: "2026-03-27T09:02:00Z",
          detail: "Primary catalog heartbeat timed out while refreshing diagnostics."
        },
        {
          link_id: "catalog-archive",
          label: "Archive parquet catalog",
          status: "degraded",
          latency_ms: 184,
          last_checked_at: "2026-03-27T09:02:00Z",
          detail: "Archive scans are above the latency budget but still returning bounded snapshots."
        }
      ],
      query_timings: [
        {
          query_id: "catalog-history-btc",
          surface: "catalog",
          status: "slow",
          limit: 100,
          window_start: "2026-03-27T07:00:00Z",
          window_end: "2026-03-27T09:00:00Z",
          returned_rows: 100,
          duration_ms: 1480,
          detail: "Catalog scan hit the operator warning threshold but remained bounded."
        }
      ],
      errors: [
        {
          section: "diagnostics.links",
          message: "Primary catalog heartbeat timed out while refreshing diagnostics."
        }
      ]
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<DiagnosticsPage />);

  expect(await screen.findByRole("heading", { name: "Diagnostics" })).toBeInTheDocument();
  expect(await screen.findByText("Primary catalog heartbeat timed out while refreshing diagnostics.")).toBeInTheDocument();
  expect(await screen.findByText("Archive parquet catalog")).toBeInTheDocument();
  expect(await screen.findByText("Catalog scan hit the operator warning threshold but remained bounded.")).toBeInTheDocument();
  expect(screen.getByText("Analysis workbench")).toBeInTheDocument();
  expect(
    screen.getByText("Link health, bounded query timing, and catalog sync posture across the analysis workbench.")
  ).toBeInTheDocument();
  expect(screen.getByText("Page title: Diagnostics")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Workbench copy: Link health, bounded query timing, and catalog sync posture across the analysis workbench."
    )
  ).toBeInTheDocument();
  expect(screen.getByText("Last updated: 2026-03-27T09:03:00Z")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/diagnostics");
});
