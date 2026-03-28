import type { MessageKey, TranslationParams } from "../shared/i18n/catalog";


export type WorkbenchId = "operations" | "analysis";

export type WorkbenchRouteDescriptor = {
  to: string;
  workbench: WorkbenchId;
  labelKey: MessageKey;
};

type CatalogTranslator = (key: MessageKey, params?: TranslationParams) => string;

export type LocalizedWorkbenchNavGroup = {
  title: string;
  items: Array<{
    to: string;
    label: string;
    workbench: WorkbenchId;
  }>;
};

const WORKBENCH_ROUTE_CATALOG: readonly WorkbenchRouteDescriptor[] = [
  { to: "/", labelKey: "navigation.routes.overview", workbench: "operations" },
  { to: "/nodes", labelKey: "navigation.routes.nodes", workbench: "operations" },
  { to: "/strategies", labelKey: "navigation.routes.strategies", workbench: "operations" },
  { to: "/adapters", labelKey: "navigation.routes.adapters", workbench: "operations" },
  { to: "/audit", labelKey: "navigation.routes.audit", workbench: "operations" },
  { to: "/config", labelKey: "navigation.routes.config", workbench: "operations" },
  { to: "/orders", labelKey: "navigation.routes.orders", workbench: "operations" },
  { to: "/fills", labelKey: "navigation.routes.fills", workbench: "operations" },
  { to: "/positions", labelKey: "navigation.routes.positions", workbench: "operations" },
  { to: "/accounts", labelKey: "navigation.routes.accounts", workbench: "operations" },
  { to: "/risk", labelKey: "navigation.routes.risk", workbench: "operations" },
  { to: "/logs", labelKey: "navigation.routes.logs", workbench: "operations" },
  { to: "/catalog", labelKey: "navigation.routes.catalog", workbench: "analysis" },
  { to: "/playback", labelKey: "navigation.routes.playback", workbench: "analysis" },
  { to: "/diagnostics", labelKey: "navigation.routes.diagnostics", workbench: "analysis" },
  { to: "/backtests", labelKey: "navigation.routes.backtests", workbench: "analysis" },
  { to: "/reports", labelKey: "navigation.routes.reports", workbench: "analysis" }
] as const;

const WORKBENCH_ORDER: readonly WorkbenchId[] = ["operations", "analysis"];

const DEFAULT_WORKBENCH_ROUTES: Record<WorkbenchId, string> = {
  operations: "/",
  analysis: "/backtests"
};

const WORKBENCH_LABEL_KEYS: Record<WorkbenchId, MessageKey> = {
  operations: "navigation.workbenches.operations",
  analysis: "navigation.workbenches.analysis"
};

export function getWorkbenchOrder(): readonly WorkbenchId[] {
  return WORKBENCH_ORDER;
}

export function getDefaultWorkbenchRoute(workbench: WorkbenchId): string {
  return DEFAULT_WORKBENCH_ROUTES[workbench];
}

export function getWorkbenchRouteDescriptors(workbench?: WorkbenchId): readonly WorkbenchRouteDescriptor[] {
  if (!workbench) {
    return WORKBENCH_ROUTE_CATALOG;
  }

  return WORKBENCH_ROUTE_CATALOG.filter((route) => route.workbench === workbench);
}

export function getWorkbenchRouteDescriptor(pathname: string): WorkbenchRouteDescriptor | null {
  return WORKBENCH_ROUTE_CATALOG.find((route) => route.to === pathname) ?? null;
}

export function getWorkbenchRouteDescriptorOrDefault(pathname: string): WorkbenchRouteDescriptor {
  return getWorkbenchRouteDescriptor(pathname) ?? WORKBENCH_ROUTE_CATALOG[0];
}

export function isWorkbenchRoute(pathname: string, workbench?: WorkbenchId): boolean {
  const descriptor = getWorkbenchRouteDescriptor(pathname);

  if (!descriptor) {
    return false;
  }

  return workbench ? descriptor.workbench === workbench : true;
}

export function getLocalizedWorkbenchLabel(t: CatalogTranslator, workbench: WorkbenchId): string {
  return t(WORKBENCH_LABEL_KEYS[workbench]);
}

export function getLocalizedRouteLabel(t: CatalogTranslator, to: string, fallbackLabel?: string): string {
  const descriptor = getWorkbenchRouteDescriptor(to);

  if (descriptor) {
    return t(descriptor.labelKey);
  }

  return fallbackLabel ?? to;
}

export function getLocalizedWorkbenchNavGroups(t: CatalogTranslator): LocalizedWorkbenchNavGroup[] {
  return WORKBENCH_ORDER.map((workbench) => ({
    title: getLocalizedWorkbenchLabel(t, workbench),
    items: getWorkbenchRouteDescriptors(workbench).map((route) => ({
      to: route.to,
      label: t(route.labelKey),
      workbench: route.workbench
    }))
  }));
}
