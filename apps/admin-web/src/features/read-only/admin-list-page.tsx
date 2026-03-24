import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useAdminRuntime } from "../../app/admin-runtime";
import type { AdminListSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


type Column<T> = {
  header: string;
  render: (item: T) => ReactNode;
};

type Props<T> = {
  title: string;
  query: UseQueryResult<AdminListSnapshot<T>, Error>;
  emptyDescription: string;
  loadingDescription: string;
  tableLabel: string;
  columns: Column<T>[];
  getRowKey: (item: T, index: number) => string;
};

export function AdminListPage<T>({
  title,
  query,
  emptyDescription,
  loadingDescription,
  tableLabel,
  columns,
  getRowKey
}: Props<T>) {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title={title} description={loadingDescription} />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title={title} description={error} />;
  }

  if (!snapshot && connectionState === "stale") {
    return (
      <PageState
        kind="stale"
        title={title}
        description="Waiting for a fresh admin snapshot."
      />
    );
  }

  if (!snapshot && connectionState === "disconnected") {
    return (
      <PageState
        kind="stale"
        title={title}
        description="Reconnect the admin API to refresh runtime state."
      />
    );
  }

  if (!snapshot) {
    return <PageState kind="loading" title={title} description={loadingDescription} />;
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title={title}
        description={error ?? "Showing the last successfully received admin snapshot."}
        meta={lastUpdated}
      />
    );
  }

  if (snapshot.items.length === 0) {
    return (
      <PageState
        kind="empty"
        title={title}
        description={emptyDescription}
        meta={lastUpdated}
      />
    );
  }

  return (
    <section className="resource-card">
      <div className="resource-header">
        <div>
          <h2>{title}</h2>
          {snapshot.partial ? <p className="resource-alert">Showing the latest partial snapshot.</p> : null}
        </div>
        {lastUpdated}
      </div>
      {snapshot.errors.length > 0 ? (
        <ul className="resource-errors">
          {snapshot.errors.map((resourceError) => (
            <li key={`${resourceError.section}:${resourceError.message}`}>
              <strong>{resourceError.section}</strong>
              {`: ${resourceError.message}`}
            </li>
          ))}
        </ul>
      ) : null}
      <table aria-label={tableLabel} className="resource-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {snapshot.items.map((item, index) => (
            <tr key={getRowKey(item, index)}>
              {columns.map((column) => (
                <td key={column.header}>{column.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
