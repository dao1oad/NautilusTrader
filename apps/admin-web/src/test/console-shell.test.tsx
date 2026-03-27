import { fireEvent, render, screen } from "@testing-library/react";

import { App } from "../app";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

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

test("mounts navigation routes only after opening the compact drawer", async () => {
  stubMatchMedia(true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(screen.queryByRole("link", { name: "Nodes" })).not.toBeInTheDocument();

  fireEvent.click(await screen.findByRole("button", { name: "Open navigation" }));

  expect(await screen.findByRole("link", { name: "Nodes" })).toBeInTheDocument();

  fireEvent.click(screen.getByText("Close navigation"));

  expect(screen.queryByRole("link", { name: "Nodes" })).not.toBeInTheDocument();
});
