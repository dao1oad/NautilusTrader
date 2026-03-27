import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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

const COMPACT_NAVIGATION_MEDIA_QUERY = "(max-width: 720px)";
const COMPACT_NAVIGATION_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

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

function readCompactNavigationMatch() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(COMPACT_NAVIGATION_MEDIA_QUERY).matches;
}

function getCompactNavigationFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(COMPACT_NAVIGATION_FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex !== -1 && !element.hasAttribute("disabled")
  );
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
  const [isCompactNavigation, setIsCompactNavigation] = useState(() => readCompactNavigationMatch());
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationRef = useRef<HTMLElement | null>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreTriggerFocusRef = useRef(false);
  const currentWorkbenchLabel = formatWorkbenchLabel(currentWorkbench);
  const shouldRenderSidebar = !isCompactNavigation || navigationOpen;

  function closeNavigation({ restoreFocus }: { restoreFocus: boolean }) {
    shouldRestoreTriggerFocusRef.current = restoreFocus;
    setNavigationOpen(false);
  }

  useEffect(() => {
    setNavigationOpen(false);
  }, [currentWorkbench, runtimeMeta.pageTitle]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(COMPACT_NAVIGATION_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactNavigation(event.matches);
    };

    setIsCompactNavigation(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (isCompactNavigation || !navigationOpen) {
      return;
    }

    shouldRestoreTriggerFocusRef.current = false;
    setNavigationOpen(false);
  }, [isCompactNavigation, navigationOpen]);

  useEffect(() => {
    if (!isCompactNavigation) {
      shouldRestoreTriggerFocusRef.current = false;
      return;
    }

    if (!navigationOpen) {
      if (shouldRestoreTriggerFocusRef.current) {
        navigationTriggerRef.current?.focus();
        shouldRestoreTriggerFocusRef.current = false;
      }

      return;
    }

    const navigation = navigationRef.current;

    if (!navigation) {
      return;
    }

    const focusableElements = getCompactNavigationFocusableElements(navigation);
    const initialFocusTarget = focusableElements[0] ?? navigation;
    initialFocusTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentNavigation = navigationRef.current;

      if (!currentNavigation) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeNavigation({ restoreFocus: true });
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusableElements = getCompactNavigationFocusableElements(currentNavigation);
      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        currentNavigation.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement && currentNavigation.contains(document.activeElement)
          ? document.activeElement
          : null;

      if (event.shiftKey) {
        if (activeElement === firstElement || activeElement === null) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (activeElement === lastElement || activeElement === null) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactNavigation, navigationOpen]);

  return (
    <main className="app-shell">
      <div className="console-frame">
        {shouldRenderSidebar ? (
          <aside
            aria-label={isCompactNavigation ? "Workbench navigation" : undefined}
            aria-modal={isCompactNavigation ? true : undefined}
            className="console-sidebar"
            data-open={navigationOpen ? "true" : "false"}
            id="workbench-navigation"
            ref={navigationRef}
            role={isCompactNavigation ? "dialog" : undefined}
            tabIndex={isCompactNavigation ? -1 : undefined}
          >
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
                    onClick={() => closeNavigation({ restoreFocus: true })}
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
                          <Link
                            className="console-nav-link"
                            onClick={() => closeNavigation({ restoreFocus: true })}
                            to={item.to}
                          >
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
                    <Link
                      className="console-recent-link"
                      onClick={() => closeNavigation({ restoreFocus: true })}
                      to={route.to}
                    >
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
        ) : null}
        {isCompactNavigation && navigationOpen ? (
          <button
            aria-label="Close navigation"
            className="console-nav-scrim"
            onClick={() => closeNavigation({ restoreFocus: true })}
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
                  aria-controls={shouldRenderSidebar ? "workbench-navigation" : undefined}
                  aria-expanded={navigationOpen}
                  className="console-nav-toggle"
                  onClick={() => {
                    if (navigationOpen) {
                      closeNavigation({ restoreFocus: true });
                      return;
                    }

                    shouldRestoreTriggerFocusRef.current = false;
                    setNavigationOpen(true);
                  }}
                  ref={navigationTriggerRef}
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
