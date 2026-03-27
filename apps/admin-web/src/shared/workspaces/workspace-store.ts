export type WorkbenchId = "operations" | "analysis";

export type WorkspaceRoutePreference = {
  filterText: string;
  layout: "table";
};

export type WorkspaceRouteVisit = {
  to: string;
  label: string;
  workbench: WorkbenchId;
};

export type WorkspaceRecentRoute = WorkspaceRouteVisit & {
  visitedAt: string;
};

export type WorkspaceState = {
  activeWorkbench: WorkbenchId;
  lastRouteByWorkbench: Record<WorkbenchId, string>;
  recentRoutes: WorkspaceRecentRoute[];
  routePreferences: Record<string, WorkspaceRoutePreference>;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const WORKSPACE_STORAGE_KEY = "nautilus-admin-workspace";

const DEFAULT_ROUTE_VISIT: WorkspaceRecentRoute = {
  to: "/",
  label: "Overview",
  workbench: "operations",
  visitedAt: "1970-01-01T00:00:00.000Z"
};

const DEFAULT_ROUTE_PREFERENCE: WorkspaceRoutePreference = {
  filterText: "",
  layout: "table"
};

const DEFAULT_WORKBENCH_ROUTES: Record<WorkbenchId, string> = {
  operations: "/",
  analysis: "/backtests"
};

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    activeWorkbench: "operations",
    lastRouteByWorkbench: { ...DEFAULT_WORKBENCH_ROUTES },
    recentRoutes: [DEFAULT_ROUTE_VISIT],
    routePreferences: {
      [DEFAULT_ROUTE_VISIT.to]: { ...DEFAULT_ROUTE_PREFERENCE }
    }
  };
}

function normalizeWorkspaceState(value: Partial<WorkspaceState> | null | undefined): WorkspaceState {
  const defaults = createDefaultWorkspaceState();

  return {
    activeWorkbench: value?.activeWorkbench === "analysis" ? "analysis" : defaults.activeWorkbench,
    lastRouteByWorkbench: {
      operations: value?.lastRouteByWorkbench?.operations ?? defaults.lastRouteByWorkbench.operations,
      analysis: value?.lastRouteByWorkbench?.analysis ?? defaults.lastRouteByWorkbench.analysis
    },
    recentRoutes: Array.isArray(value?.recentRoutes) && value?.recentRoutes.length > 0
      ? value.recentRoutes
      : defaults.recentRoutes,
    routePreferences: {
      ...defaults.routePreferences,
      ...(value?.routePreferences ?? {})
    }
  };
}

export function readWorkspaceState(storage?: StorageLike | null): WorkspaceState {
  if (!storage) {
    return createDefaultWorkspaceState();
  }

  const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (!raw) {
    return createDefaultWorkspaceState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return normalizeWorkspaceState(parsed);
  } catch {
    return createDefaultWorkspaceState();
  }
}

export function writeWorkspaceState(storage: StorageLike | null | undefined, state: WorkspaceState): void {
  storage?.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
}

export function recordRouteVisit(state: WorkspaceState, route: WorkspaceRouteVisit): WorkspaceState {
  const visitedAt = new Date().toISOString();
  const recentRoute: WorkspaceRecentRoute = {
    ...route,
    visitedAt
  };
  const existingPreference = state.routePreferences[route.to] ?? DEFAULT_ROUTE_PREFERENCE;
  const recentRoutes = [
    recentRoute,
    ...state.recentRoutes.filter((entry) => entry.to !== route.to)
  ].slice(0, 6);

  return {
    activeWorkbench: route.workbench,
    lastRouteByWorkbench: {
      ...state.lastRouteByWorkbench,
      [route.workbench]: route.to
    },
    recentRoutes,
    routePreferences: {
      ...state.routePreferences,
      [route.to]: { ...existingPreference }
    }
  };
}

export function resolveWorkbenchDestination(
  state: WorkspaceState,
  workbench: WorkbenchId,
  fallbackRoute: string,
): string {
  return state.lastRouteByWorkbench[workbench] ?? fallbackRoute;
}
