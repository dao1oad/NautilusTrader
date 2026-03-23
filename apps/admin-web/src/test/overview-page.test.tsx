import { render, screen } from "@testing-library/react";

import { OverviewPage } from "../features/overview/overview-page";


test("renders overview heading", () => {
  render(<OverviewPage />);
  expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
});
