import { render, screen } from "@testing-library/react";

import { PageState } from "../shared/ui/page-state";


test("renders stale state explicitly", () => {
  render(<PageState kind="stale" title="Connection stale" />);

  expect(screen.getByText("Snapshot delayed")).toBeInTheDocument();
  expect(screen.getByText("Connection stale")).toBeInTheDocument();
});
