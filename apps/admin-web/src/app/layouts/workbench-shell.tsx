import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  ConsoleShell,
  type ConsoleNavGroup,
  type ConsoleRuntimeMeta,
  type ConsoleRecentRoute,
  type ConsoleWorkbenchEntry,
  type ConsoleWorkbenchId
} from "./console-shell";
import { useCurrentWorkbenchShellMeta } from "../workbench-shell-meta";
import {
  readWorkspaceState,
  recordRouteVisit,
  resolveWorkbenchDestination,
  type WorkbenchId,
  writeWorkspaceState
} from "../../shared/workspaces/workspace-store";


const OPERATIONS_ITEMS = [
  { to: "/", label: "Overview", workbench: "operations" },
  { to: "/nodes", label: "Nodes", workbench: "operations" },
  { to: "/strategies", label: "Strategies", workbench: "operations" },
  { to: "/adapters", label: "Adapters", workbench: "operations" },
  { to: "/audit", label: "Audit", workbench: "operations" },
  { to: "/config", label: "Config", workbench: "operations" },
  { to: "/orders", label: "Blotter", workbench: "operations" },
  { to: "/fills", label: "Fills", workbench: "operations" },
  { to: "/positions", label: "Positions", workbench: "operations" },
  { to: "/accounts", label: "Accounts", workbench: "operations" },
  { to: "/risk", label: "Risk Center", workbench: "operations" },
  { to: "/logs", label: "Logs", workbench: "operations" }
] as const;

const ANALYSIS_ITEMS = [
  { to: "/catalog", label: "Catalog", workbench: "analysis" },
  { to: "/playback", label: "Playback", workbench: "analysis" },
  { to: "/diagnostics", label: "Diagnostics", workbench: "analysis" },
  { to: "/backtests", label: "Backtests", workbench: "analysis" },
  { to: "/reports", label: "Reports", workbench: "analysis" }
] as const;

const WORKBENCH_COPY: Record<ConsoleWorkbenchId, string> = {
  operations: "Live control-plane routes, receipts, and runtime guardrails stay grouped under the operations workstation.",
  analysis: "Backtests, reports, playback, and diagnostics stay grouped under the bounded analysis workstation."
};

const WORKBENCH_STATUS_SUMMARY: Record<ConsoleWorkbenchId, string> = {
  operations: "Operational routes are pinned locally with recent-view memory preserved in the browser workspace.",
  analysis: "Analysis routes remain bounded to local playback, catalog, diagnostics, and reporting surfaces."
};

const NAV_GROUPS: ConsoleNavGroup[] = [
  {
    title: "Operations",
    items: OPERATIONS_ITEMS.map(({ to, label }) => ({ to, label }))
  },
  {
    title: "Analysis",
    items: ANALYSIS_ITEMS.map(({ to, label }) => ({ to, label }))
  }
];

const ALL_ITEMS = [...OPERATIONS_ITEMS, ...ANALYSIS_ITEMS];

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getRouteDescriptor(pathname: string): {
  to: string;
  label: string;
  workbench: WorkbenchId;
} {
  return ALL_ITEMS.find((item) => item.to === pathname) ?? OPERATIONS_ITEMS[0];
}

function getWorkbenchLabel(workbench: ConsoleWorkbenchId) {
  return workbench.charAt(0).toUpperCase() + workbench.slice(1);
}

type Props = {
  children: ReactNode;
};

export function WorkbenchShell({ children }: Props) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const [workspaceState, setWorkspaceState] = useState(() => readWorkspaceState(getBrowserStorage()));
  const currentRoute = getRouteDescriptor(pathname);

  useEffect(() => {
    const storage = getBrowserStorage();
    const nextWorkspaceState = recordRouteVisit(readWorkspaceState(storage), currentRoute);

    writeWorkspaceState(storage, nextWorkspaceState);
    setWorkspaceState(nextWorkspaceState);
  }, [currentRoute, pathname]);

  const activeWorkbench = currentRoute.workbench;
  const workbenchEntries: ConsoleWorkbenchEntry[] = [
    {
      label: "Operations",
      to: resolveWorkbenchDestination(workspaceState, "operations", "/"),
      active: activeWorkbench === "operations"
    },
    {
      label: "Analysis",
      to: resolveWorkbenchDestination(workspaceState, "analysis", "/backtests"),
      active: activeWorkbench === "analysis"
    }
  ];
  const runtimeMeta = useCurrentWorkbenchShellMeta({
    pageTitle: currentRoute.label,
    workbenchCopy: WORKBENCH_COPY[currentRoute.workbench],
    lastUpdated: null,
    statusSummary: `${getWorkbenchLabel(currentRoute.workbench)} workbench ready. ${WORKBENCH_STATUS_SUMMARY[currentRoute.workbench]}`
  }) as ConsoleRuntimeMeta;

  return (
    <ConsoleShell
      currentWorkbench={activeWorkbench}
      navGroups={NAV_GROUPS}
      recentRoutes={workspaceState.recentRoutes.slice(0, 4) as ConsoleRecentRoute[]}
      runtimeMeta={runtimeMeta}
      workbenchEntries={workbenchEntries}
    >
      {children}
    </ConsoleShell>
  );
}
