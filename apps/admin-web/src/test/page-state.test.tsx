import { screen } from "@testing-library/react";

import { PageState } from "../shared/ui/page-state";
import { renderWithProviders } from "./setup";


test("renders stale state explicitly", () => {
  renderWithProviders(<PageState kind="stale" title="Connection stale" />);

  expect(screen.getByText("Snapshot delayed")).toBeInTheDocument();
  expect(screen.getByText("Connection stale")).toBeInTheDocument();
});


test("renders stale state explicitly in Simplified Chinese", () => {
  renderWithProviders(<PageState kind="stale" title="连接延迟" />, { locale: "zh-CN" });

  expect(screen.getByText("快照延迟")).toBeInTheDocument();
  expect(screen.getByText("连接延迟")).toBeInTheDocument();
});
