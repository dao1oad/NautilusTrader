import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

export type ConsoleRuntimeMeta = {
  pageTitle: string;
  workbenchCopy: string;
  lastUpdated: string | null;
  statusSummary: string | null;
};

type Props = {
  children: ReactNode;
  currentWorkbench: ConsoleWorkbenchId;
  navGroups: readonly ConsoleNavGroup[];
  recentRoutes: readonly ConsoleRecentRoute[];
  runtimeMeta: ConsoleRuntimeMeta;
  workbenchEntries: readonly ConsoleWorkbenchEntry[];
};

function formatWorkbenchLabel(workbench: ConsoleWorkbenchId) {
  return workbench.charAt(0).toUpperCase() + workbench.slice(1);
}

function formatCompactTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Awaiting page telemetry";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Awaiting page telemetry";
  }

  return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

export function ConsoleShell({
  children,
  currentWorkbench,
  navGroups,
  recentRoutes,
  runtimeMeta,
  workbenchEntries
}: Props) {
  const { connectionState } = useAdminRuntime();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const currentWorkbenchLabel = formatWorkbenchLabel(currentWorkbench);

  useEffect(() => {
    setNavigationOpen(false);
  }, [currentWorkbench, runtimeMeta.pageTitle]);

  return (
    <main className="app-shell">
      <div className="console-frame">
        <aside className="console-sidebar" data-open={navigationOpen ? "true" : "false"} id="workbench-navigation">
          <div className="console-sidebar-header">
            <p className="app-kicker">Operator workstation</p>
            <h1>NautilusTrader Admin</h1>
            <p className="console-sidebar-copy">Pinned local shell for live operations, runtime diagnostics, and bounded analysis surfaces.</p>
          </div>
          <dl className="console-sidebar-meta">
            <div className="console-sidebar-meta-item">
              <dt>Runtime</dt>
              <dd>Local process</dd>
            </div>
            <div className="console-sidebar-meta-item">
              <dt>Workspace</dt>
              <dd>Browser-pinned memory</dd>
            </div>
            <div className="console-sidebar-meta-item">
              <dt>Active desk</dt>
              <dd>{currentWorkbenchLabel}</dd>
            </div>
          </dl>
          <section className="console-workbench-switcher">
            <p className="app-kicker">Workbench entry points</p>
            <div className="console-workbench-entry-list">
              {workbenchEntries.map((entry) => (
                <Link
                  className="console-workbench-link"
                  data-active={entry.active}
                  key={entry.label}
                  onClick={() => setNavigationOpen(false)}
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
                        <Link className="console-nav-link" onClick={() => setNavigationOpen(false)} to={item.to}>
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
                  <Link className="console-recent-link" onClick={() => setNavigationOpen(false)} to={route.to}>
                    <span className="console-recent-label">{route.label}</span>
                    <span className="console-recent-meta">
                      <span className="console-recent-workbench">{formatWorkbenchLabel(route.workbench)}</span>
                      <time dateTime={route.visitedAt}>{formatCompactTimestamp(route.visitedAt)}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        {navigationOpen ? (
          <button
            aria-label="Close navigation"
            className="console-nav-scrim"
            onClick={() => setNavigationOpen(false)}
            type="button"
          />
        ) : null}
        <section className="console-panel">
          <header className="console-toolbar">
            <div className="console-toolbar-main">
              <div>
                <p className="console-section-kicker">Runtime status</p>
                <h2>{runtimeMeta.pageTitle}</h2>
                <p className="console-toolbar-copy">{runtimeMeta.workbenchCopy}</p>
                {runtimeMeta.statusSummary ? (
                  <p className="console-runtime-summary">{runtimeMeta.statusSummary}</p>
                ) : null}
              </div>
              <div className="console-toolbar-actions">
                <button
                  aria-controls="workbench-navigation"
                  aria-expanded={navigationOpen}
                  className="console-nav-toggle"
                  onClick={() => setNavigationOpen((current) => !current)}
                  type="button"
                >
                  {navigationOpen ? "Close navigation" : "Open navigation"}
                </button>
                <ConnectionBanner state={connectionState} />
              </div>
            </div>
            <div className="console-runtime-strip">
              <section className="console-runtime-card">
                <p className="console-runtime-label">Workbench</p>
                <strong>{currentWorkbenchLabel}</strong>
              </section>
              <section className="console-runtime-card">
                <p className="console-runtime-label">Surface</p>
                <strong>{runtimeMeta.pageTitle}</strong>
              </section>
              <section className="console-runtime-card">
                <p className="console-runtime-label">Last updated</p>
                <strong>
                  <time dateTime={runtimeMeta.lastUpdated ?? undefined}>
                    {formatCompactTimestamp(runtimeMeta.lastUpdated)}
                  </time>
                </strong>
              </section>
              <section className="console-runtime-card">
                <p className="console-runtime-label">Environment</p>
                <strong>Local operator shell</strong>
              </section>
            </div>
          </header>
          <div className="console-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
