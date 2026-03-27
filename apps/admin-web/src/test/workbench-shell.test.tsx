import { render, screen } from "@testing-library/react";

import { App } from "../app";
import {
  WorkbenchShellMeta,
  WorkbenchShellMetaProvider,
  useCurrentWorkbenchShellMeta
} from "../app/workbench-shell-meta";
import { readWorkspaceState } from "../shared/workspaces/workspace-store";


test("renders workbench entry points and seeds local workspace state", async () => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );

  render(<App />);

  expect(await screen.findByText("Runtime status")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Operations" })).toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "Analysis" })).toBeInTheDocument();
  expect(await screen.findByText("Recent views")).toBeInTheDocument();

  const workspace = readWorkspaceState(window.localStorage);
  expect(workspace.activeWorkbench).toBe("operations");
  expect(workspace.lastRouteByWorkbench.operations).toBe("/");
  expect(workspace.recentRoutes[0]).toMatchObject({
    to: "/",
    label: "Overview",
    workbench: "operations"
  });
});

function ShellMetaProbe() {
  const meta = useCurrentWorkbenchShellMeta();

  return (
    <section>
      <p>{meta.pageTitle ?? "No title"}</p>
      <p>{meta.workbenchCopy ?? "No copy"}</p>
      <p>{meta.lastUpdated ?? "No timestamp"}</p>
      <p>{meta.statusSummary ?? "No status"}</p>
    </section>
  );
}

function ShellMetaHarness({ active }: { active: boolean }) {
  return (
    <WorkbenchShellMetaProvider>
      <ShellMetaProbe />
      {active ? (
        <WorkbenchShellMeta
          lastUpdated="2026-03-28T08:15:00Z"
          pageTitle="Risk Center"
          statusSummary="3 pending risk alerts"
          workbenchCopy="Monitor margin, exposure, and guardrails."
        />
      ) : null}
    </WorkbenchShellMetaProvider>
  );
}

test("clears route-owned shell metadata when the owner unmounts", () => {
  const { rerender } = render(<ShellMetaHarness active />);

  expect(screen.getByText("Risk Center")).toBeInTheDocument();
  expect(screen.getByText("Monitor margin, exposure, and guardrails.")).toBeInTheDocument();
  expect(screen.getByText("2026-03-28T08:15:00Z")).toBeInTheDocument();
  expect(screen.getByText("3 pending risk alerts")).toBeInTheDocument();

  rerender(<ShellMetaHarness active={false} />);

  expect(screen.getByText("No title")).toBeInTheDocument();
  expect(screen.getByText("No copy")).toBeInTheDocument();
  expect(screen.getByText("No timestamp")).toBeInTheDocument();
  expect(screen.getByText("No status")).toBeInTheDocument();
});
