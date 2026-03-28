import { act } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Link,
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter
} from "@tanstack/react-router";

import { App } from "../app";
import { AdminRuntimeProvider } from "../app/admin-runtime";
import { WorkbenchShell } from "../app/layouts/workbench-shell";
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

function ShellMetaTitleProbe({ fallbackTitle }: { fallbackTitle: string }) {
  const meta = useCurrentWorkbenchShellMeta({ pageTitle: fallbackTitle });

  return <p>{meta.pageTitle}</p>;
}

function ShellMetaSummaryProbe({ fallbackSummary }: { fallbackSummary: string }) {
  const meta = useCurrentWorkbenchShellMeta({ statusSummary: fallbackSummary });

  return <p>{meta.statusSummary ?? "No status"}</p>;
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

test("replaces removed route metadata with the current fallback immediately", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        <WorkbenchShellMetaProvider>
          <ShellMetaTitleProbe fallbackTitle="Overview" />
          <WorkbenchShellMeta pageTitle="Risk Center" />
        </WorkbenchShellMetaProvider>
      );
    });

    expect(container.textContent).toContain("Risk Center");

    flushSync(() => {
      root.render(
        <WorkbenchShellMetaProvider>
          <ShellMetaTitleProbe fallbackTitle="Nodes" />
        </WorkbenchShellMetaProvider>
      );
    });

    expect(container.textContent).toContain("Nodes");
    expect(container.textContent).not.toContain("Risk Center");
  } finally {
    root.unmount();
    container.remove();
  }
});

test("allows a route owner to clear the fallback status summary explicitly", () => {
  render(
    <WorkbenchShellMetaProvider>
      <ShellMetaSummaryProbe fallbackSummary="Operations workbench ready." />
      <WorkbenchShellMeta statusSummary={null} />
    </WorkbenchShellMetaProvider>
  );

  expect(screen.getByText("No status")).toBeInTheDocument();
  expect(screen.queryByText("Operations workbench ready.")).not.toBeInTheDocument();
});

test("preserves previously published fields when a later publisher updates a different field", () => {
  render(
    <WorkbenchShellMetaProvider>
      <ShellMetaProbe />
      <WorkbenchShellMeta pageTitle="Risk Center" workbenchCopy="Monitor margin, exposure, and guardrails." />
      <WorkbenchShellMeta lastUpdated="2026-03-28T08:15:00Z" priority={2} />
    </WorkbenchShellMetaProvider>
  );

  expect(screen.getByText("Risk Center")).toBeInTheDocument();
  expect(screen.getByText("Monitor margin, exposure, and guardrails.")).toBeInTheDocument();
  expect(screen.getByText("2026-03-28T08:15:00Z")).toBeInTheDocument();
});

function RuntimeStripTestRoot() {
  return (
    <AdminRuntimeProvider value={{ connectionState: "connected", error: null }}>
      <WorkbenchShellMetaProvider>
        <WorkbenchShell>
          <Outlet />
        </WorkbenchShell>
      </WorkbenchShellMetaProvider>
    </AdminRuntimeProvider>
  );
}

function OverviewMetaRoutePage() {
  return (
    <>
      <WorkbenchShellMeta
        lastUpdated="2026-03-28T08:15:00Z"
        pageTitle="Signal Console"
        statusSummary="Route summary"
        workbenchCopy="Custom route copy."
      />
      <Link to="/nodes">Open nodes route</Link>
    </>
  );
}

function NodesRoutePage() {
  return <p>Nodes route</p>;
}

test("updates the visible runtime strip when route-owned shell metadata unmounts", async () => {
  const rootRoute = createRootRoute({
    component: RuntimeStripTestRoot
  });
  const overviewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: OverviewMetaRoutePage
  });
  const nodesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/nodes",
    component: NodesRoutePage
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([overviewRoute, nodesRoute]),
    history: createMemoryHistory({
      initialEntries: ["/"]
    })
  });

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "Signal Console" })).toBeInTheDocument();
  expect(screen.getByText("Custom route copy.")).toBeInTheDocument();
  expect(screen.getByText("Route summary")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("link", { name: "Open nodes route" }));

  expect(await screen.findByRole("heading", { name: "Nodes" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Live control-plane routes, receipts, and runtime guardrails stay grouped under the operations workstation."
    )
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText("Custom route copy.")).not.toBeInTheDocument();
    expect(screen.queryByText("Route summary")).not.toBeInTheDocument();
  });
});
