import { render, screen } from "@testing-library/react";

import { OverviewPage } from "../features/overview/overview-page";


test("renders overview heading", () => {
  render(<OverviewPage />);
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
