import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { getConfigDiffSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


export function ConfigDiffPage() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const query = useQuery({
    queryKey: adminQueryKeys.config(),
    queryFn: getConfigDiffSnapshot
  });

  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title="Config diff" description="Loading local control-plane guardrails." />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Config diff" description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title="Config diff" description="Waiting for local control-plane settings." />;
  }

  if (snapshot.items.length === 0) {
    return (
      <PageState
        kind="empty"
        title="Config diff"
        description="No control-plane config entries are currently projected."
        meta={lastUpdated}
      />
    );
  }

  return (
    <section className="resource-card">
      <div className="resource-header">
        <div>
          <h2>Config diff</h2>
          <p className="overview-copy">Local control-plane guardrails and the runbooks used to verify them.</p>
        </div>
        {lastUpdated}
      </div>
      <table aria-label="Config diff" className="resource-table">
        <thead>
          <tr>
            <th scope="col">Key</th>
            <th scope="col">Desired</th>
            <th scope="col">Actual</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.items.map((entry) => (
            <tr key={entry.key}>
              <td>{entry.key}</td>
              <td>{entry.desired}</td>
              <td>{entry.actual}</td>
              <td>{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="config-runbooks">
        <h3>Recovery runbooks</h3>
        <ul className="config-runbook-list">
          {snapshot.runbooks.map((runbook) => (
            <li className="config-runbook-item" key={runbook.runbook_id}>
              <p className="audit-item-command">{runbook.title}</p>
              <p className="command-receipt-copy">{runbook.summary}</p>
              <ol className="config-runbook-steps">
                {runbook.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
