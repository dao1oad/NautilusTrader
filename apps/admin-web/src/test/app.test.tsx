import { act, screen } from "@testing-library/react";

import { App } from "../app";
import { renderWithProviders } from "./setup";

type Listener = (event: Event | { data: string }) => void;


class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  listeners: Record<string, Listener[]> = {};
  sent: string[] = [];
  url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }

  close() {}

  emit(type: string, event: Event | { data: string }) {
    for (const listener of this.listeners[type] ?? []) {
      listener(event);
    }
  }

  send(payload: string) {
    this.sent.push(payload);
  }
}


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

  renderWithProviders(<App />);

  expect(await screen.findByText("No live node configured")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/overview");
});


test("renders fetch error state when admin overview returns 500", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 500
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithProviders(<App />);

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

  renderWithProviders(<App />);

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


test("uses provider-scoped fallback translations for admin event stream errors", async () => {
  FakeWebSocket.instances = [];

  vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
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
  }));

  renderWithProviders(<App />, {
    catalogs: {
      en: {
        chrome: {
          appName: "NautilusTrader Admin"
        },
        errors: {
          adminEventStream: "Custom English stream fallback",
          adminRequestFailedWithStatus: "Admin request failed with status {status}"
        }
      },
      "zh-CN": {
        chrome: {
          appName: "NautilusTrader Admin"
        },
        errors: {
          adminEventStream: "自定义事件流回退文案",
          adminRequestFailedWithStatus: "管理端请求失败，状态码 {status}"
        }
      }
    },
    locale: "zh-CN"
  });

  expect(await screen.findByText("No live node configured")).toBeInTheDocument();

  const socket = FakeWebSocket.instances[0];
  act(() => {
    socket.emit("open", new Event("open"));
    socket.emit("message", {
      data: JSON.stringify({
        type: "server.error",
        code: "transient"
      })
    });
  });

  expect(await screen.findByText("自定义事件流回退文案")).toBeInTheDocument();
});
