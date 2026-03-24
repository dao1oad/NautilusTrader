import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { OverviewPage } from "./features/overview/overview-page";
import { getOverviewSnapshot } from "./shared/api/admin-client";
import { subscribeToAdminEvents } from "./shared/realtime/admin-events";
import type { AdminEvent, ConnectionState, OverviewSnapshot } from "./shared/types/admin";
import { ConnectionBanner } from "./features/connection/connection-banner";


export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [snapshot, setSnapshot] = useState<OverviewSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshOverview = useEffectEvent(async () => {
    try {
      const nextSnapshot = await getOverviewSnapshot();
      startTransition(() => {
        setSnapshot(nextSnapshot);
        setError(null);
      });
    } catch (nextError) {
      startTransition(() => {
        setError(nextError instanceof Error ? nextError.message : "Failed to load admin overview");
      });
    }
  });

  const handleAdminEvent = useEffectEvent((event: AdminEvent) => {
    if (event.type === "overview.updated" || event.type === "snapshot.invalidate") {
      void refreshOverview();
      return;
    }

    if (event.type === "server.error") {
      startTransition(() => {
        setError(event.message ?? "Admin event stream error");
        setConnectionState("stale");
      });
    }
  });

  useEffect(() => {
    void refreshOverview();
  }, []);

  useEffect(() => {
    return subscribeToAdminEvents({
      onEvent: handleAdminEvent,
      onStateChange: setConnectionState
    });
  }, []);

  return (
    <main className="app-shell">
      <section className="app-panel">
        <header className="app-header">
          <div>
            <p className="app-kicker">Local Control Plane</p>
            <h1>NautilusTrader Admin</h1>
          </div>
          <ConnectionBanner state={connectionState} />
        </header>
        <OverviewPage connectionState={connectionState} snapshot={snapshot} error={error} />
      </section>
    </main>
  );
}
