import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { ConnectionBanner } from "../../features/connection/connection-banner";
import { useAdminRuntime } from "../admin-runtime";


export type ConsoleWorkbenchId = "operations" | "analysis";

export type ConsoleNavItem = {
  to: string;
  label: string;
};

export type ConsoleNavGroup = {
  title: string;
  items: readonly ConsoleNavItem[];
};

export type ConsoleWorkbenchEntry = {
  to: string;
  label: string;
  active: boolean;
};

export type ConsoleRecentRoute = {
  to: string;
  label: string;
  workbench: ConsoleWorkbenchId;
  visitedAt: string;
};

type Props = {
  children: ReactNode;
  currentWorkbench: ConsoleWorkbenchId;
  currentWorkbenchCopy: string;
  navGroups: readonly ConsoleNavGroup[];
  recentRoutes: readonly ConsoleRecentRoute[];
  workbenchEntries: readonly ConsoleWorkbenchEntry[];
};

export function ConsoleShell({
  children,
  currentWorkbench,
  currentWorkbenchCopy,
  navGroups,
  recentRoutes,
  workbenchEntries
}: Props) {
  const { connectionState } = useAdminRuntime();

  return (
    <main className="app-shell">
      <div className="console-frame">
        <aside className="console-sidebar">
          <div className="console-sidebar-header">
            <p className="app-kicker">Local Control Plane</p>
            <h1>NautilusTrader Admin</h1>
            <p className="console-sidebar-copy">Unified local workbench for live operations, diagnostics, and bounded analysis surfaces.</p>
          </div>
          <section className="console-workbench-switcher">
            <p className="app-kicker">Workbench entry points</p>
            <div className="console-workbench-entry-list">
              {workbenchEntries.map((entry) => (
                <Link
                  className="console-workbench-link"
                  data-active={entry.active}
                  key={entry.label}
                  to={entry.to}
                >
                  {entry.label}
                </Link>
              ))}
            </div>
          </section>
          <nav aria-label="Workbench routes" className="console-nav">
            <div className="console-nav-groups">
              {navGroups.map((group) => (
                <section className="console-nav-group" key={group.title}>
                  <h3 className="console-nav-group-title">{group.title}</h3>
                  <ul className="console-nav-list">
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <Link className="console-nav-link" to={item.to}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </nav>
          <section className="console-recent-routes">
            <p className="app-kicker">Recent views</p>
            <ul className="console-recent-list">
              {recentRoutes.map((route) => (
                <li className="console-recent-item" key={`${route.to}:${route.visitedAt}`}>
                  <span>{route.label}</span>
                  <span className="console-recent-workbench">{route.workbench}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        <section className="console-panel">
          <header className="console-toolbar">
            <div>
              <p className="console-section-kicker">{currentWorkbench} workbench</p>
              <h2>Unified Workbench</h2>
              <p className="console-toolbar-copy">{currentWorkbenchCopy}</p>
            </div>
            <ConnectionBanner state={connectionState} />
          </header>
          <div className="console-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
