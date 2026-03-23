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
