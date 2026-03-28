import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  ConsoleShell,
  type ConsoleNavGroup,
  type ConsoleRecentRoute,
  type ConsoleWorkbenchEntry,
  type ConsoleWorkbenchId
} from "./console-shell";
import {
  getDefaultWorkbenchRoute,
  getLocalizedRouteLabel,
  getLocalizedWorkbenchLabel,
  getLocalizedWorkbenchNavGroups,
  getWorkbenchOrder,
  getWorkbenchRouteDescriptorOrDefault
} from "../workbench-route-catalog";
import { useCurrentWorkbenchShellMeta } from "../workbench-shell-meta";
import { useI18n } from "../../shared/i18n/use-i18n";
import {
  readWorkspaceState,
  recordRouteVisit,
  resolveWorkbenchDestination,
  type WorkbenchId,
  writeWorkspaceState
} from "../../shared/workspaces/workspace-store";

const WORKBENCH_COPY_KEYS: Record<ConsoleWorkbenchId, "workbenchShell.copy.operations" | "workbenchShell.copy.analysis"> = {
  operations: "workbenchShell.copy.operations",
  analysis: "workbenchShell.copy.analysis"
};

const WORKBENCH_READY_KEYS: Record<ConsoleWorkbenchId, "workbenchShell.ready.operations" | "workbenchShell.ready.analysis"> = {
  operations: "workbenchShell.ready.operations",
  analysis: "workbenchShell.ready.analysis"
};

const WORKBENCH_STATUS_KEYS: Record<
  ConsoleWorkbenchId,
  "workbenchShell.status.operations" | "workbenchShell.status.analysis"
> = {
  operations: "workbenchShell.status.operations",
  analysis: "workbenchShell.status.analysis"
};

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

type Props = {
  children: ReactNode;
};

export function WorkbenchShell({ children }: Props) {
  const { t } = useI18n();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const [workspaceState, setWorkspaceState] = useState(() => readWorkspaceState(getBrowserStorage()));
  const currentRoute = getWorkbenchRouteDescriptorOrDefault(pathname);

  useEffect(() => {
    const storage = getBrowserStorage();
    const nextWorkspaceState = recordRouteVisit(readWorkspaceState(storage), currentRoute);

    writeWorkspaceState(storage, nextWorkspaceState);
    setWorkspaceState(nextWorkspaceState);
  }, [currentRoute, pathname]);

  const activeWorkbench = currentRoute.workbench;
  const navGroups: ConsoleNavGroup[] = getLocalizedWorkbenchNavGroups(t).map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      to: item.to,
      label: item.label
    }))
  }));
  const workbenchEntries: ConsoleWorkbenchEntry[] = getWorkbenchOrder().map((workbench) => ({
    label: getLocalizedWorkbenchLabel(t, workbench),
    to: resolveWorkbenchDestination(workspaceState, workbench as WorkbenchId, getDefaultWorkbenchRoute(workbench)),
    active: activeWorkbench === workbench
  }));
  const recentRoutes: ConsoleRecentRoute[] = workspaceState.recentRoutes.slice(0, 4).map((route) => ({
    ...route,
    label: getLocalizedRouteLabel(t, route.to, route.label)
  }));
  const runtimeMeta = useCurrentWorkbenchShellMeta({
    pageTitle: getLocalizedRouteLabel(t, currentRoute.to),
    workbenchCopy: t(WORKBENCH_COPY_KEYS[currentRoute.workbench]),
    lastUpdated: null,
    statusSummary: `${t(WORKBENCH_READY_KEYS[currentRoute.workbench])} ${t(WORKBENCH_STATUS_KEYS[currentRoute.workbench])}`
  });

  return (
    <ConsoleShell
      currentWorkbench={activeWorkbench}
      navGroups={navGroups}
      recentRoutes={recentRoutes}
      runtimeMeta={runtimeMeta}
      workbenchEntries={workbenchEntries}
    >
      {children}
    </ConsoleShell>
  );
}
