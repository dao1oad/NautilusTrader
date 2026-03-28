import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getConfigDiffSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill } from "../../shared/ui/signal-pill";


const CONFIG_DIFF_COPY = "Local control-plane guardrails, drift ledger, and recovery runbooks for operator verification.";
const RUNBOOK_LIST_STYLE = {
  display: "grid",
  gap: "16px",
  listStyle: "none",
  margin: 0,
  padding: 0
} as const;
const RUNBOOK_ITEM_STYLE = {
  background: "linear-gradient(180deg, rgba(15, 26, 42, 0.94), rgba(9, 16, 27, 0.94))",
  border: "1px solid var(--border-subtle)",
  borderRadius: "18px",
  display: "grid",
  gap: "12px",
  padding: "18px"
} as const;
const MONO_LABEL_STYLE = {
  color: "var(--text-muted)",
  fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  fontSize: "0.78rem",
  letterSpacing: "0.06em",
  margin: 0,
  textTransform: "uppercase"
} as const;
const MONO_VALUE_STYLE = {
  color: "var(--text-strong)",
  fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  fontSize: "0.95rem",
  fontWeight: 700,
  margin: 0
} as const;
const SUMMARY_COPY_STYLE = {
  color: "var(--text-body)",
  fontSize: "0.86rem",
  lineHeight: 1.45,
  margin: "8px 0 0"
} as const;
const RUNBOOK_STEPS_STYLE = {
  color: "var(--text-body)",
  margin: 0,
  paddingLeft: "20px"
} as const;

function buildConfigStatusSummary(totalChecks: number, driftedChecks: number, runbookCount: number) {
  if (totalChecks === 0) {
    return "Awaiting the latest control-plane guardrail projection.";
  }

  if (driftedChecks === 0) {
    return `${totalChecks} guardrail checks in sync; ${runbookCount} recovery runbooks available.`;
  }

  return `${driftedChecks} of ${totalChecks} guardrail checks drifted; ${runbookCount} recovery runbooks available.`;
}

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
  const driftedChecks = snapshot?.items.filter((entry) => entry.status === "drifted").length ?? 0;
  const runbookCount = snapshot?.runbooks.length ?? 0;

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle: "Config diff",
    statusSummary: buildConfigStatusSummary(snapshot?.items.length ?? 0, driftedChecks, runbookCount),
    workbenchCopy: CONFIG_DIFF_COPY
  });

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
    <div className="resource-stack config-diff-stack">
      <SectionPanel
        description={CONFIG_DIFF_COPY}
        eyebrow="Guardrail drift ledger"
        meta={lastUpdated}
        signal={
          <SignalPill
            detail={driftedChecks > 0 ? `${driftedChecks} drifted` : "in sync"}
            label={`${snapshot.items.length} checks`}
            tone={driftedChecks > 0 ? "warning" : "positive"}
          />
        }
        title="Config diff"
      >
        <table aria-label="Config diff" className="resource-table config-diff-table">
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
                <td>
                  <p style={MONO_VALUE_STYLE}>{entry.key}</p>
                  <p style={SUMMARY_COPY_STYLE}>{entry.summary}</p>
                </td>
                <td>{entry.desired}</td>
                <td>{entry.actual}</td>
                <td>{entry.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionPanel>

      <SectionPanel
        description="Runbooks remain navigation and verification aids for local recovery; they do not execute changes from this page."
        eyebrow="Recovery guidance"
        signal={<SignalPill label={`${runbookCount} runbooks`} tone="info" />}
        title="Recovery runbooks"
      >
        <ul style={RUNBOOK_LIST_STYLE}>
          {snapshot.runbooks.map((runbook) => (
            <li key={runbook.runbook_id} style={RUNBOOK_ITEM_STYLE}>
              <p style={MONO_LABEL_STYLE}>{runbook.runbook_id}</p>
              <p className="audit-item-command">{runbook.title}</p>
              <p className="command-receipt-copy">{runbook.summary}</p>
              <ol style={RUNBOOK_STEPS_STYLE}>
                {runbook.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </SectionPanel>
    </div>
  );
}
