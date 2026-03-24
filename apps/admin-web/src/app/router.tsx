import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { RootRouteComponent } from "./routes/__root";
import { OverviewRoutePage } from "./routes/overview";
import { NodesRoutePage } from "./routes/nodes";
import { StrategiesRoutePage } from "./routes/strategies";
import { AdaptersRoutePage } from "./routes/adapters";
import { OrdersRoutePage } from "./routes/orders";
import { PositionsRoutePage } from "./routes/positions";
import { AccountsRoutePage } from "./routes/accounts";
import { LogsRoutePage } from "./routes/logs";


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

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersRoutePage
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

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/logs",
  component: LogsRoutePage
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  nodesRoute,
  strategiesRoute,
  adaptersRoute,
  ordersRoute,
  positionsRoute,
  accountsRoute,
  logsRoute
]);

export const router = createRouter({
  routeTree
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
