import { render, screen } from "@testing-library/react";

import { App } from "../app";
import { readWorkspaceState } from "../shared/workspaces/workspace-store";


test("renders workbench entry points and seeds local workspace state", async () => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(await screen.findByRole("link", { name: "Operations" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Analysis" })).toBeInTheDocument();

  const workspace = readWorkspaceState(window.localStorage);
  expect(workspace.activeWorkbench).toBe("operations");
  expect(workspace.lastRouteByWorkbench.operations).toBe("/");
  expect(workspace.recentRoutes[0]).toMatchObject({
    to: "/",
    label: "Overview",
    workbench: "operations"
  });
});
