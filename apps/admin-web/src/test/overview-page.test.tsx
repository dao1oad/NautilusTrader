import { render, screen } from "@testing-library/react";

import { OverviewPage } from "../features/overview/overview-page";


test("renders overview heading", () => {
  render(
    <OverviewPage
      connectionState="connected"
      snapshot={{
        generated_at: "2026-03-24T00:00:00Z",
        stale: false,
        partial: false,
        node: { status: "running", node_id: "node-1" },
        strategies: [],
        adapters: [],
        accounts: [],
        positions: [],
        errors: []
      }}
    />
  );

  expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
});


test("renders stale banner when connection is stale", () => {
  render(<OverviewPage connectionState="stale" snapshot={null} error={null} />);
  expect(screen.getByText("Connection stale")).toBeInTheDocument();
});


test("renders loaded node status instead of waiting copy when snapshot exists", () => {
  render(
    <OverviewPage
      connectionState="connected"
      snapshot={{
        generated_at: "2026-03-23T00:00:00Z",
        stale: false,
        partial: false,
        node: { status: "running", node_id: "node-1" },
        strategies: [],
        adapters: [],
        accounts: [],
        positions: [],
        errors: []
      }}
      error={null}
    />
  );

  expect(screen.getByText("Node status: running")).toBeInTheDocument();
  expect(screen.queryByText("Waiting for admin snapshot.")).not.toBeInTheDocument();
});


test("renders cached snapshot as stale when a refresh error is present", () => {
  render(
    <OverviewPage
      connectionState="connected"
      snapshot={{
        generated_at: "2026-03-24T00:00:00Z",
        stale: false,
        partial: false,
        node: { status: "running", node_id: "node-1" },
        strategies: [],
        adapters: [],
        accounts: [],
        positions: [],
        errors: []
      }}
      error="Refresh failed"
    />
  );

  expect(screen.getByText("Overview refresh failed")).toBeInTheDocument();
  expect(screen.getByText("Refresh failed")).toBeInTheDocument();
  expect(screen.getByText("Last updated 2026-03-24 00:00:00 UTC")).toBeInTheDocument();
  expect(screen.queryByText("Node status: running")).not.toBeInTheDocument();
});
