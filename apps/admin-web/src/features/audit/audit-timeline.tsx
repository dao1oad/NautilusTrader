import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getAuditSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill } from "../../shared/ui/signal-pill";


const AUDIT_TIMELINE_COPY =
  "Append-only receipt stream for low-risk local control actions and operator recovery guidance.";
const RECEIPT_LIST_STYLE = {
  display: "grid",
  gap: "16px",
  listStyle: "none",
  margin: 0,
  padding: 0
} as const;
const RECEIPT_ITEM_STYLE = {
  background: "linear-gradient(180deg, rgba(15, 26, 42, 0.94), rgba(9, 16, 27, 0.94))",
  border: "1px solid var(--border-subtle)",
  borderRadius: "18px",
  display: "grid",
  gap: "14px",
  padding: "18px"
} as const;
const RECEIPT_HEADER_STYLE = {
  alignItems: "flex-start",
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
  justifyContent: "space-between"
} as const;
const RECEIPT_LABEL_STYLE = {
  color: "var(--text-muted)",
  fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  fontSize: "0.78rem",
  letterSpacing: "0.06em",
  margin: 0,
  textTransform: "uppercase"
} as const;
const RECEIPT_GRID_STYLE = {
  display: "grid",
  gap: "12px 16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  margin: 0
} as const;
const RECEIPT_GRID_GROUP_STYLE = {
  display: "grid",
  gap: "6px"
} as const;
const RECEIPT_META_LABEL_STYLE = {
  color: "var(--text-muted)",
  fontSize: "0.74rem",
  letterSpacing: "0.12em",
  margin: 0,
  textTransform: "uppercase"
} as const;
const RECEIPT_META_VALUE_STYLE = {
  color: "var(--text-strong)",
  fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  fontSize: "0.9rem",
  margin: 0
} as const;
const RECEIPT_GUIDANCE_STYLE = {
  borderTop: "1px solid rgba(255, 210, 127, 0.14)",
  display: "grid",
  gap: "10px",
  paddingTop: "14px"
} as const;
const RECEIPT_GUIDANCE_TITLE_STYLE = {
  color: "var(--signal-warning)",
  fontSize: "0.82rem",
  letterSpacing: "0.12em",
  margin: 0,
  textTransform: "uppercase"
} as const;
const RECEIPT_LINK_STYLE = {
  color: "var(--signal-info)",
  fontWeight: 700,
  textDecoration: "none",
  width: "fit-content"
} as const;

function formatTerminalTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

function buildAuditStatusSummary(receiptCount: number, failureCount: number) {
  if (receiptCount === 0) {
    return "Awaiting the first low-risk control receipt.";
  }

  if (failureCount === 0) {
    return `${receiptCount} receipts recorded with no recovery guidance required.`;
  }

  return `${receiptCount} receipts recorded; ${failureCount} require recovery guidance.`;
}

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
  const receiptCount = snapshot?.items.length ?? 0;
  const failureCount = snapshot?.items.filter((record) => record.failure != null).length ?? 0;

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle: "Audit timeline",
    statusSummary: buildAuditStatusSummary(receiptCount, failureCount),
    workbenchCopy: AUDIT_TIMELINE_COPY
  });

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
    <SectionPanel
      description={AUDIT_TIMELINE_COPY}
      eyebrow="Action receipt stream"
      meta={lastUpdated}
      signal={
        <SignalPill
          detail={failureCount > 0 ? `${failureCount} flagged` : "all current"}
          label={`${receiptCount} receipts`}
          tone={failureCount > 0 ? "warning" : "info"}
        />
      }
      title="Audit timeline"
    >
      <ol style={RECEIPT_LIST_STYLE}>
        {snapshot.items.map((record) => (
          <li key={`${record.command_id}:${record.sequence_id}`} style={RECEIPT_ITEM_STYLE}>
            <div style={RECEIPT_HEADER_STYLE}>
              <p style={RECEIPT_LABEL_STYLE}>{`Receipt ${record.sequence_id}`}</p>
              <span className="audit-status" data-status={record.status}>
                {record.status}
              </span>
            </div>
            <dl style={RECEIPT_GRID_STYLE}>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>Command</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{record.command}</dd>
              </div>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>Target</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{record.target ?? "No target recorded"}</dd>
              </div>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>Result state</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{record.status}</dd>
              </div>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>Recorded</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{formatTerminalTimestamp(record.recorded_at)}</dd>
              </div>
            </dl>
            {record.message ? <p className="command-receipt-copy">{record.message}</p> : null}
            {record.failure ? (
              <div style={RECEIPT_GUIDANCE_STYLE}>
                <p style={RECEIPT_GUIDANCE_TITLE_STYLE}>Recovery guidance</p>
                <p className="command-receipt-copy">
                  Use the local recovery runbook for the next operator step; this surface remains navigation-only.
                </p>
                <a href="/config" style={RECEIPT_LINK_STYLE}>
                  Open recovery runbook
                </a>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionPanel>
  );
}
