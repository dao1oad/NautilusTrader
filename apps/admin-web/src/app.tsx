import { ConnectionBanner, type ConnectionState } from "./features/connection/connection-banner";
import { OverviewPage } from "./features/overview/overview-page";


export function App() {
  const connectionState: ConnectionState = "connecting";

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
        <OverviewPage />
      </section>
    </main>
  );
}
