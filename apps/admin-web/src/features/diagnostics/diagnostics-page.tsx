import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getDiagnosticsSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { DiagnosticsSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { MetricTile } from "../../shared/ui/metric-tile";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill, type SignalTone } from "../../shared/ui/signal-pill";
import { WorkbenchHeader } from "../../shared/ui/workbench-header";


const DIAGNOSTICS_COPY =
  "Link health, bounded query timing, and catalog sync posture across the analysis workbench.";

const SUMMARY_FIELDS: Array<{
  detail: string;
  label: string;
  key: keyof DiagnosticsSnapshot["summary"];
}> = [
  { detail: "Aggregate posture for bounded analysis dependencies.", label: "Overall status", key: "overall_status" },
  { detail: "Links currently reporting healthy bounded snapshots.", label: "Healthy links", key: "healthy_links" },
  { detail: "Links currently outside the expected latency posture.", label: "Degraded links", key: "degraded_links" },
  { detail: "Queries currently above the operator warning threshold.", label: "Slow queries", key: "slow_queries" },
  { detail: "Latest bounded catalog sync timestamp in diagnostics memory.", label: "Latest catalog sync", key: "latest_catalog_sync_at" }
];

function renderResourceErrors(errors: Array<{ section: string; message: string }>) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <ul className="resource-errors">
      {errors.map((resourceError) => (
        <li key={`${resourceError.section}:${resourceError.message}`}>
          <strong>{resourceError.section}</strong>
          {`: ${resourceError.message}`}
        </li>
      ))}
    </ul>
  );
}

function toDiagnosticsTone(overallStatus: DiagnosticsSnapshot["summary"]["overall_status"]): SignalTone {
  if (overallStatus === "healthy") {
    return "positive";
  }

  if (overallStatus === "partial") {
    return "warning";
  }

  return "danger";
}

function toSummaryTone(
  field: keyof DiagnosticsSnapshot["summary"],
  value: DiagnosticsSnapshot["summary"][keyof DiagnosticsSnapshot["summary"]]
): SignalTone {
  switch (field) {
    case "overall_status":
      return toDiagnosticsTone(value as DiagnosticsSnapshot["summary"]["overall_status"]);
    case "healthy_links":
      return Number(value) > 0 ? "positive" : "info";
    case "degraded_links":
    case "slow_queries":
      return Number(value) > 0 ? "warning" : "positive";
    default:
      return "info";
  }
}

function buildDiagnosticsStatusSummary(snapshot: DiagnosticsSnapshot | null) {
  if (!snapshot) {
    return "Awaiting diagnostics telemetry.";
  }

  return `${snapshot.summary.overall_status} posture, ${snapshot.summary.degraded_links} degraded links, ${snapshot.summary.slow_queries} slow queries.`;
}


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

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle: "Diagnostics",
    statusSummary: buildDiagnosticsStatusSummary(snapshot),
    workbenchCopy: DIAGNOSTICS_COPY
  });

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
      <WorkbenchHeader
        description={DIAGNOSTICS_COPY}
        eyebrow="Analysis workbench"
        summary={buildDiagnosticsStatusSummary(snapshot)}
        title="Diagnostics"
      >
        <SignalPill
          detail={`${snapshot.summary.degraded_links} degraded links`}
          label={snapshot.summary.overall_status}
          tone={toDiagnosticsTone(snapshot.summary.overall_status)}
        />
        {lastUpdated}
      </WorkbenchHeader>

      <SectionPanel
        description="Catalog, replay, and bounded query health projected for local analysis operators."
        eyebrow="Diagnostic posture"
        title="Diagnostic posture"
      >
        {snapshot.partial ? <p className="resource-alert">Showing the latest partial diagnostics snapshot.</p> : null}
        {renderResourceErrors(snapshot.errors)}
        <div aria-label="Diagnostics summary" className="metric-grid">
          {SUMMARY_FIELDS.map((field) => (
            <MetricTile
              detail={field.detail}
              key={field.label}
              label={field.label}
              tone={toSummaryTone(field.key, snapshot.summary[field.key])}
              value={snapshot.summary[field.key]}
            />
          ))}
        </div>
      </SectionPanel>

      <SectionPanel
        description="Bounded health checks for the links that feed catalog, replay, and diagnostics surfaces."
        eyebrow="Link health"
        title="Link health"
      >
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
      </SectionPanel>

      <SectionPanel
        description="Bounded query timings remain visible so operators can see latency drift before widening analysis windows."
        eyebrow="Query timings"
        title="Query timings"
      >
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
      </SectionPanel>
    </div>
  );
}
