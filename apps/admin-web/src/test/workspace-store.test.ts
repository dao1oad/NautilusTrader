import {
  createDefaultWorkspaceState,
  recordRouteVisit,
  readWorkspaceState,
  resolveWorkbenchDestination
} from "../shared/workspaces/workspace-store";


test("records route visits and tracks the latest route for each workbench", () => {
  const initial = createDefaultWorkspaceState();

  const withAnalysisVisit = recordRouteVisit(initial, {
    to: "/backtests",
    label: "Backtests",
    workbench: "analysis"
  });

  const withOperationsVisit = recordRouteVisit(withAnalysisVisit, {
    to: "/risk",
    label: "Risk Center",
    workbench: "operations"
  });

  expect(withAnalysisVisit.activeWorkbench).toBe("analysis");
  expect(withAnalysisVisit.lastRouteByWorkbench.analysis).toBe("/backtests");
  expect(withAnalysisVisit.routePreferences["/backtests"]).toEqual({
    filterText: "",
    layout: "table"
  });
  expect(withOperationsVisit.activeWorkbench).toBe("operations");
  expect(withOperationsVisit.lastRouteByWorkbench.operations).toBe("/risk");
  expect(withOperationsVisit.routePreferences["/risk"]).toEqual({
    filterText: "",
    layout: "table"
  });
  expect(resolveWorkbenchDestination(withOperationsVisit, "analysis", "/catalog")).toBe("/backtests");
  expect(withOperationsVisit.recentRoutes.map((route) => route.to)).toEqual(["/risk", "/backtests", "/"]);
  expect(withOperationsVisit.recentRoutes[0]).not.toHaveProperty("label");
});

test("normalizes legacy route memory without depending on persisted localized labels", () => {
  const storage = {
    getItem: vi.fn(() => JSON.stringify({
      activeWorkbench: "operations",
      lastRouteByWorkbench: {
        operations: "/risk",
        analysis: "/backtests"
      },
      recentRoutes: [
        {
          to: "/risk",
          label: "Risk Center",
          workbench: "operations",
          visitedAt: "2026-03-28T08:14:00.000Z"
        }
      ],
      routePreferences: {
        "/risk": {
          filterText: "",
          layout: "table"
        }
      }
    }))
  };

  const workspace = readWorkspaceState(storage);

  expect(resolveWorkbenchDestination(workspace, "operations", "/")).toBe("/risk");
  expect(workspace.recentRoutes[0]).toMatchObject({
    to: "/risk",
    workbench: "operations",
    visitedAt: "2026-03-28T08:14:00.000Z"
  });
  expect(workspace.recentRoutes[0]).not.toHaveProperty("label");
});

test("repairs invalid workbench destinations and preserves legacy labels for unknown routes", () => {
  const storage = {
    getItem: vi.fn(() => JSON.stringify({
      activeWorkbench: "operations",
      lastRouteByWorkbench: {
        operations: "/missing",
        analysis: "/ghost"
      },
      recentRoutes: [
        {
          to: "/missing",
          label: "Legacy Route",
          workbench: "operations",
          visitedAt: "2026-03-28T08:20:00.000Z"
        }
      ],
      routePreferences: {}
    }))
  };

  const workspace = readWorkspaceState(storage);

  expect(workspace.lastRouteByWorkbench).toEqual({
    operations: "/",
    analysis: "/backtests"
  });
  expect(workspace.recentRoutes[0]).toMatchObject({
    to: "/missing",
    label: "Legacy Route",
    workbench: "operations",
    visitedAt: "2026-03-28T08:20:00.000Z"
  });
});
