import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { getDiagnosticsSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { DiagnosticsSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


const SUMMARY_FIELDS: Array<{ label: string; key: keyof DiagnosticsSnapshot["summary"] }> = [
  { label: "Overall status", key: "overall_status" },
  { label: "Healthy links", key: "healthy_links" },
  { label: "Degraded links", key: "degraded_links" },
  { label: "Slow queries", key: "slow_queries" },
  { label: "Latest catalog sync", key: "latest_catalog_sync_at" }
];


export function DiagnosticsPage() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const query = useQuery({
    queryKey: adminQueryKeys.diagnostics(),
    queryFn: getDiagnosticsSnapshot
  });

  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title="Diagnostics" description="Loading link health and query timing diagnostics." />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Diagnostics" description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title="Diagnostics" description="Waiting for diagnostics state." />;
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title="Diagnostics"
        description={error ?? "Showing the last successfully received diagnostics snapshot."}
        meta={lastUpdated}
      />
    );
  }

  return (
    <div className="resource-stack">
      <section className="resource-card">
        <div className="resource-header">
          <div>
            <h2>Diagnostics</h2>
            <p className="overview-copy">Catalog, replay, and query health projected for local operators.</p>
            {snapshot.partial ? <p className="resource-alert">Showing the latest partial diagnostics snapshot.</p> : null}
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
        <div aria-label="Diagnostics summary" className="metric-grid">
          {SUMMARY_FIELDS.map((field) => (
            <article className="metric-card" key={field.label}>
              <p className="metric-label">{field.label}</p>
              <p className="metric-value">{snapshot.summary[field.key]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resource-card">
        <div className="resource-header">
          <div>
            <h3>Link health</h3>
          </div>
        </div>
        <table aria-label="Diagnostics link health" className="resource-table">
          <thead>
            <tr>
              <th scope="col">Link</th>
              <th scope="col">Status</th>
              <th scope="col">Latency</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.links.map((link) => (
              <tr key={link.link_id}>
                <td>{link.label}</td>
                <td>{link.status}</td>
                <td>{`${link.latency_ms} ms`}</td>
                <td>{link.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="resource-card">
        <div className="resource-header">
          <div>
            <h3>Query timings</h3>
          </div>
        </div>
        <table aria-label="Diagnostics query timings" className="resource-table">
          <thead>
            <tr>
              <th scope="col">Query</th>
              <th scope="col">Surface</th>
              <th scope="col">Status</th>
              <th scope="col">Rows</th>
              <th scope="col">Duration</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.query_timings.map((timing) => (
              <tr key={timing.query_id}>
                <td>{timing.query_id}</td>
                <td>{timing.surface}</td>
                <td>{timing.status}</td>
                <td>{timing.returned_rows}</td>
                <td>{`${timing.duration_ms} ms`}</td>
                <td>{timing.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
