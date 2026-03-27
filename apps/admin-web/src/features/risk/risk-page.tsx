import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { getRiskSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { RiskSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


const SUMMARY_FIELDS: Array<{ label: string; key: keyof RiskSnapshot["summary"] }> = [
  { label: "Trading state", key: "trading_state" },
  { label: "Risk level", key: "risk_level" },
  { label: "Margin utilization", key: "margin_utilization" },
  { label: "Exposure utilization", key: "exposure_utilization" },
  { label: "Active alerts", key: "active_alerts" },
  { label: "Blocked actions", key: "blocked_actions" }
];


export function RiskPage() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const query = useQuery({
    queryKey: adminQueryKeys.risk(),
    queryFn: getRiskSnapshot
  });

  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title="Risk center" description="Loading margin and risk controls." />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Risk center" description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title="Risk center" description="Waiting for risk state." />;
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title="Risk center"
        description={error ?? "Showing the last successfully received risk snapshot."}
        meta={lastUpdated}
      />
    );
  }

  return (
    <div className="resource-stack">
      <section className="resource-card">
        <div className="resource-header">
          <div>
            <h2>Risk center</h2>
            <p className="overview-copy">Cross-account margin, exposure, and runtime operator guardrails.</p>
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
        <div aria-label="Risk summary" className="metric-grid">
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
            <h3>Risk events</h3>
          </div>
        </div>
        {snapshot.events.length === 0 ? (
          <p className="resource-filter-empty">No active risk events are currently projected.</p>
        ) : (
          <ul className="detail-list">
            {snapshot.events.map((event) => (
              <li key={event.event_id}>
                <p className="audit-item-command">{event.title}</p>
                <p className="command-receipt-copy">{event.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="resource-card">
        <div className="resource-header">
          <div>
            <h3>Active blocks</h3>
          </div>
        </div>
        {snapshot.blocks.length === 0 ? (
          <p className="resource-filter-empty">No active risk blocks are currently projected.</p>
        ) : (
          <table aria-label="Active risk blocks" className="resource-table">
            <thead>
              <tr>
                <th scope="col">Scope</th>
                <th scope="col">Reason</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.blocks.map((block) => (
                <tr key={block.block_id}>
                  <td>{block.scope}</td>
                  <td>{block.reason}</td>
                  <td>{block.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
