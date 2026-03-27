import {
  createDefaultWorkspaceState,
  recordRouteVisit,
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
});
