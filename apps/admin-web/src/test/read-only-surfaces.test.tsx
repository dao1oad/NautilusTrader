import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { AdminRuntimeProvider } from "../app/admin-runtime";
import { AdaptersPage } from "../features/adapters/adapters-page";
import { NodesPage } from "../features/nodes/nodes-page";
import { StrategiesPage } from "../features/strategies/strategies-page";
import { TestProviders } from "./setup";


function renderWithRuntime(ui: ReactElement, locale: "en" | "zh-CN" = "en") {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <TestProviders locale={locale}>
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
    </TestProviders>
  );
}


test("renders node rows from the nodes snapshot", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-24T00:00:00Z",
      partial: false,
      items: [{ node_id: "node-alpha", status: "running" }],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<NodesPage />);

  expect(await screen.findByText("node-alpha")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Nodes" })).toBeInTheDocument();
  expect(screen.getByText("Live snapshot")).toBeInTheDocument();
  expect(
    screen.getByText("Runtime node identity, assignment, and process status from the latest admin snapshot.")
  ).toBeInTheDocument();
  expect(screen.getByText("running")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/nodes");
});


test("renders an explicit empty state when no strategies are reported", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-24T00:00:00Z",
      partial: false,
      items: [],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<StrategiesPage />);

  expect(await screen.findByText("No strategies are currently reported by the admin API.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Strategies" })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/strategies");
});


test("surfaces adapter request failures through the shared page state", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 503
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<AdaptersPage />);

  expect(await screen.findByText("Admin request failed with status 503")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/admin/adapters");
});


test("localizes shared list chrome in Simplified Chinese", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      generated_at: "2026-03-24T00:00:00Z",
      partial: false,
      items: [{ node_id: "node-alpha", status: "running" }],
      errors: []
    })
  });

  vi.stubGlobal("fetch", fetchMock);

  renderWithRuntime(<NodesPage />, "zh-CN");

  expect(await screen.findByText("node-alpha")).toBeInTheDocument();
  expect(screen.getByText("实时快照")).toBeInTheDocument();
  expect(screen.getByText("上次更新 2026-03-24 00:00:00 UTC")).toBeInTheDocument();
});


test("localizes operations page-owned list copy in Simplified Chinese", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-24T00:00:00Z",
        partial: false,
        items: [{ node_id: "node-alpha", status: "running" }],
        errors: []
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generated_at: "2026-03-24T00:00:00Z",
        partial: false,
        items: [],
        errors: []
      })
    });

  vi.stubGlobal("fetch", fetchMock);

  const { unmount } = renderWithRuntime(<NodesPage />, "zh-CN");

  expect(await screen.findByText("node-alpha")).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "节点" })).toBeInTheDocument();
  expect(screen.getByText("运行时节点标识、归属与进程状态，均来自最新管理快照。")).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "节点" })).toBeInTheDocument();

  unmount();

  renderWithRuntime(<StrategiesPage />, "zh-CN");

  expect(await screen.findByRole("heading", { name: "策略" })).toBeInTheDocument();
  expect(await screen.findByText("管理 API 当前未报告任何策略。")).toBeInTheDocument();
});
