import { QueryClientProvider } from "@tanstack/react-query";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";

import { AdminRuntimeProvider } from "./app/admin-runtime";
import { router } from "./app/router";
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
      if (scope !== "admin" || resource !== "overview") {
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
