import { QueryClientProvider } from "@tanstack/react-query";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";

import { AdminRuntimeProvider } from "./app/admin-runtime";
import { router } from "./app/router";
import { READ_ONLY_DEFAULT_LIMIT } from "./shared/api/admin-client";
import { subscribeToAdminEvents } from "./shared/realtime/admin-events";
import { adminQueryKeys, queryClient } from "./shared/query/query-client";
import { subscribeToInvalidations } from "./shared/realtime/invalidation-bus";
import type { AdminEvent, ConnectionState } from "./shared/types/admin";


export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);

  const handleConnectionStateChange = useEffectEvent((nextState: ConnectionState) => {
    startTransition(() => {
      setConnectionState(nextState);

      if (nextState === "connected") {
        setError(null);
      }
    });
  });

  const handleAdminEvent = useEffectEvent((event: AdminEvent) => {
    if (event.type === "server.error") {
      startTransition(() => {
        setError(event.message ?? "Admin event stream error");
      });
    }
  });

  useEffect(() => {
    return subscribeToAdminEvents({
      onEvent: handleAdminEvent,
      onStateChange: handleConnectionStateChange
    });
  }, []);

  useEffect(() => {
    return subscribeToInvalidations((topic) => {
      if (topic === "overview") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview() });
        return;
      }

      if (topic === "nodes") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.nodes() });
        return;
      }

      if (topic === "strategies") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.strategies() });
        return;
      }

      if (topic === "adapters") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.adapters() });
        return;
      }

      if (topic === "audit") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.audit() });
        return;
      }

      if (topic === "config") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.config() });
        return;
      }

      if (topic === "orders") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders(READ_ONLY_DEFAULT_LIMIT) });
        return;
      }

      if (topic === "fills") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.fills(READ_ONLY_DEFAULT_LIMIT) });
        return;
      }

      if (topic === "positions") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.positions(READ_ONLY_DEFAULT_LIMIT) });
        return;
      }

      if (topic === "accounts") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts(READ_ONLY_DEFAULT_LIMIT) });
        return;
      }

      if (topic === "risk") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.risk() });
        return;
      }

      if (topic === "logs") {
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.logs(READ_ONLY_DEFAULT_LIMIT) });
      }
    });
  }, []);

  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event?.type !== "updated") {
        return;
      }

      if (event.action.type !== "success") {
        return;
      }

      const [scope, resource] = event.query.queryKey;
      if (
        scope !== "admin" ||
        (resource !== "overview" &&
          resource !== "nodes" &&
          resource !== "strategies" &&
          resource !== "adapters" &&
          resource !== "audit" &&
          resource !== "config" &&
          resource !== "orders" &&
          resource !== "fills" &&
          resource !== "positions" &&
          resource !== "accounts" &&
          resource !== "risk" &&
          resource !== "logs")
      ) {
        return;
      }

      if (event.query.state.status !== "success" || event.query.state.data == null) {
        return;
      }

      startTransition(() => {
        setError(null);
      });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AdminRuntimeProvider value={{ connectionState, error }}>
        <RouterProvider router={router} />
      </AdminRuntimeProvider>
    </QueryClientProvider>
  );
}
