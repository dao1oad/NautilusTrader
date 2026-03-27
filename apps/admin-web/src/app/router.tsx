import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { RootRouteComponent } from "./routes/__root";
import { AuditRoutePage } from "./routes/audit";
import { ConfigRoutePage } from "./routes/config";
import { OverviewRoutePage } from "./routes/overview";
import { NodesRoutePage } from "./routes/nodes";
import { StrategiesRoutePage } from "./routes/strategies";
import { AdaptersRoutePage } from "./routes/adapters";
import { OrdersRoutePage } from "./routes/orders";
import { FillsRoutePage } from "./routes/fills";
import { PositionsRoutePage } from "./routes/positions";
import { AccountsRoutePage } from "./routes/accounts";
import { RiskRoutePage } from "./routes/risk";
import { LogsRoutePage } from "./routes/logs";
import { CatalogRoutePage } from "./routes/catalog";
import { PlaybackRoutePage } from "./routes/playback";
import { DiagnosticsRoutePage } from "./routes/diagnostics";


const rootRoute = createRootRoute({
  component: RootRouteComponent
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewRoutePage
});

const nodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nodes",
  component: NodesRoutePage
});

const strategiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/strategies",
  component: StrategiesRoutePage
});

const adaptersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/adapters",
  component: AdaptersRoutePage
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: AuditRoutePage
});

const configRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/config",
  component: ConfigRoutePage
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersRoutePage
});

const fillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fills",
  component: FillsRoutePage
});

const positionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/positions",
  component: PositionsRoutePage
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: AccountsRoutePage
});

const riskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/risk",
  component: RiskRoutePage
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/logs",
  component: LogsRoutePage
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  component: CatalogRoutePage
});

const playbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/playback",
  component: PlaybackRoutePage
});

const diagnosticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/diagnostics",
  component: DiagnosticsRoutePage
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  nodesRoute,
  strategiesRoute,
  adaptersRoute,
  auditRoute,
  configRoute,
  ordersRoute,
  fillsRoute,
  positionsRoute,
  accountsRoute,
  riskRoute,
  logsRoute,
  catalogRoute,
  playbackRoute,
  diagnosticsRoute
]);

export const router = createRouter({
  routeTree
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
