import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { ConnectionBanner } from "../../features/connection/connection-banner";
import { useAdminRuntime } from "../admin-runtime";


const NAV_ITEMS = [
  { to: "/", label: "Overview" },
  { to: "/nodes", label: "Nodes" },
  { to: "/strategies", label: "Strategies" },
  { to: "/adapters", label: "Adapters" },
  { to: "/audit", label: "Audit" },
  { to: "/config", label: "Config" },
  { to: "/orders", label: "Blotter" },
  { to: "/fills", label: "Fills" },
  { to: "/positions", label: "Positions" },
  { to: "/accounts", label: "Accounts" },
  { to: "/risk", label: "Risk Center" },
  { to: "/logs", label: "Logs" },
  { to: "/catalog", label: "Catalog" },
  { to: "/playback", label: "Playback" },
  { to: "/diagnostics", label: "Diagnostics" }
] as const;

type Props = {
  children: ReactNode;
};

export function ConsoleShell({ children }: Props) {
  const { connectionState } = useAdminRuntime();

  return (
    <main className="app-shell">
      <div className="console-frame">
        <aside className="console-sidebar">
          <div className="console-sidebar-header">
            <p className="app-kicker">Local Control Plane</p>
            <h1>NautilusTrader Admin</h1>
            <p className="console-sidebar-copy">Local operations and control console for runtime guardrails, receipts, and recovery.</p>
          </div>
          <nav aria-label="Operations" className="console-nav">
            <ul className="console-nav-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link className="console-nav-link" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section className="console-panel">
          <header className="console-toolbar">
            <div>
              <p className="console-section-kicker">Operations and control</p>
              <h2>Operations Console</h2>
            </div>
            <ConnectionBanner state={connectionState} />
          </header>
          <div className="console-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
