import { render, screen } from "@testing-library/react";

import { App } from "../app";


test("renders navigation entries for read-only operations routes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(await screen.findByRole("link", { name: "Overview" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Nodes" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Strategies" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Orders" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Audit" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Config" })).toBeInTheDocument();
});
