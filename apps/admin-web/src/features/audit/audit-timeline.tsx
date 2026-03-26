import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { getAuditSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";


export function AuditTimeline() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const query = useQuery({
    queryKey: adminQueryKeys.audit(),
    queryFn: getAuditSnapshot
  });

  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title="Audit timeline" description="Loading command audit history." />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Audit timeline" description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title="Audit timeline" description="Waiting for audit history." />;
  }

  if (snapshot.items.length === 0) {
    return (
      <PageState
        kind="empty"
        title="Audit timeline"
        description="No control commands have been recorded yet."
        meta={lastUpdated}
      />
    );
  }

  return (
    <section className="resource-card">
      <div className="resource-header">
        <div>
          <h2>Audit timeline</h2>
          <p className="overview-copy">Append-only receipts for low-risk local control actions.</p>
        </div>
        {lastUpdated}
      </div>
      <ol className="audit-timeline">
        {snapshot.items.map((record) => (
          <li className="audit-item" key={`${record.command_id}:${record.sequence_id}`}>
            <div className="audit-item-header">
              <div>
                <p className="audit-item-command">{record.command}</p>
                <p className="command-receipt-copy">{record.target ?? "No target recorded"}</p>
              </div>
              <span className="audit-status" data-status={record.status}>
                {record.status}
              </span>
            </div>
            {record.message ? <p className="command-receipt-copy">{record.message}</p> : null}
            {record.failure ? (
              <a className="audit-runbook-link" href="/config">
                Open recovery runbook
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
