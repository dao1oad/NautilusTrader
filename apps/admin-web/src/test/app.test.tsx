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
