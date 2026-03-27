import { render, screen } from "@testing-library/react";

import { App } from "../app";


test("renders navigation entries for read-only operations routes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(await screen.findByText("Runtime status")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  expect(await screen.findByText("Recent views")).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Operations" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Analysis" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Overview" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Nodes" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Strategies" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Blotter" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Fills" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Risk Center" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Catalog" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Playback" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Diagnostics" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Backtests" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Reports" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Audit" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Config" })).toBeInTheDocument();
});
