export type WorkbenchId = "operations" | "analysis";

export type WorkspaceRoutePreference = {
  filterText: string;
  layout: "table";
};

export type WorkspaceRouteVisit = {
  to: string;
  workbench: WorkbenchId;
  label?: string;
};

export type WorkspaceRecentRoute = {
  to: string;
  workbench: WorkbenchId;
  visitedAt: string;
};

export type WorkspaceState = {
  activeWorkbench: WorkbenchId;
  lastRouteByWorkbench: Record<WorkbenchId, string>;
  recentRoutes: WorkspaceRecentRoute[];
  routePreferences: Record<string, WorkspaceRoutePreference>;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type PersistedWorkspaceRecentRoute = WorkspaceRecentRoute & {
  label?: string;
};

type PersistedWorkspaceState = Omit<WorkspaceState, "recentRoutes"> & {
  recentRoutes: PersistedWorkspaceRecentRoute[];
};

export const WORKSPACE_STORAGE_KEY = "nautilus-admin-workspace";

const DEFAULT_ROUTE_VISIT: WorkspaceRecentRoute = {
  to: "/",
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

function normalizeRecentRoute(route: Partial<PersistedWorkspaceRecentRoute> | null | undefined): WorkspaceRecentRoute | null {
  if (!route?.to || typeof route.visitedAt !== "string") {
    return null;
  }

  if (route.workbench !== "operations" && route.workbench !== "analysis") {
    return null;
  }

  return {
    to: route.to,
    workbench: route.workbench,
    visitedAt: route.visitedAt
  };
}

function normalizeWorkspaceState(value: Partial<PersistedWorkspaceState> | null | undefined): WorkspaceState {
  const defaults = createDefaultWorkspaceState();
  const recentRoutes = Array.isArray(value?.recentRoutes)
    ? value.recentRoutes
      .map((route) => normalizeRecentRoute(route))
      .filter((route): route is WorkspaceRecentRoute => route !== null)
    : [];

  return {
    activeWorkbench: value?.activeWorkbench === "analysis" ? "analysis" : defaults.activeWorkbench,
    lastRouteByWorkbench: {
      operations: value?.lastRouteByWorkbench?.operations ?? defaults.lastRouteByWorkbench.operations,
      analysis: value?.lastRouteByWorkbench?.analysis ?? defaults.lastRouteByWorkbench.analysis
    },
    recentRoutes: recentRoutes.length > 0 ? recentRoutes : defaults.recentRoutes,
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
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceState>;
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
    to: route.to,
    workbench: route.workbench,
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
