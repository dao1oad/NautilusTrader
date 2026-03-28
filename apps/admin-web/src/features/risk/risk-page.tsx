import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getRiskSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { RiskSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { MetricTile } from "../../shared/ui/metric-tile";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill, type SignalTone } from "../../shared/ui/signal-pill";


const RISK_CENTER_COPY = "Immediate guardrail posture, alert stream, and hard constraints for local trading operations.";

const SUMMARY_FIELDS: Array<{
  detail: string;
  label: string;
  key: keyof RiskSnapshot["summary"];
}> = [
  { detail: "Current severity projected by the local risk engine.", label: "Risk level", key: "risk_level" },
  { detail: "Hard constraints currently projected.", label: "Blocked actions", key: "blocked_actions" },
  { detail: "Signals currently flowing into the alert stream.", label: "Active alerts", key: "active_alerts" },
  { detail: "Current operator posture from the risk engine.", label: "Trading state", key: "trading_state" },
  { detail: "Configured margin window currently consumed.", label: "Margin utilization", key: "margin_utilization" },
  { detail: "Risk window currently consumed by live exposures.", label: "Exposure utilization", key: "exposure_utilization" }
];
const DETAIL_LIST_STYLE = {
  display: "grid",
  gap: "16px",
  listStyle: "none",
  margin: 0,
  padding: 0
} as const;
const DETAIL_CARD_STYLE = {
  background: "linear-gradient(180deg, rgba(15, 26, 42, 0.94), rgba(9, 16, 27, 0.94))",
  border: "1px solid var(--border-subtle)",
  borderRadius: "18px",
  display: "grid",
  gap: "14px",
  padding: "18px"
} as const;
const DETAIL_HEADER_STYLE = {
  alignItems: "flex-start",
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
  justifyContent: "space-between"
} as const;
const DETAIL_TIME_STYLE = {
  color: "var(--text-muted)",
  fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  fontSize: "0.78rem",
  letterSpacing: "0.06em",
  margin: 0,
  textTransform: "uppercase"
} as const;
const CONSTRAINT_SCOPE_STYLE = {
  color: "var(--text-strong)",
  fontFamily: "\"IBM Plex Mono\", \"SFMono-Regular\", monospace",
  fontSize: "0.95rem",
  fontWeight: 700,
  margin: 0
} as const;

function formatTerminalTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

function toRiskTone(riskLevel: string): SignalTone {
  const normalizedRiskLevel = riskLevel.toLowerCase();

  if (normalizedRiskLevel.includes("critical")) {
    return "danger";
  }

  if (normalizedRiskLevel.includes("elevated") || normalizedRiskLevel.includes("reduce")) {
    return "warning";
  }

  if (normalizedRiskLevel.includes("monitor")) {
    return "info";
  }

  return "positive";
}

function toEventTone(severity: "info" | "warn" | "critical"): SignalTone {
  if (severity === "critical") {
    return "danger";
  }

  if (severity === "warn") {
    return "warning";
  }

  return "info";
}

function toUtilizationTone(value: string): SignalTone {
  const numericValue = Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return "info";
  }

  if (numericValue >= 0.75) {
    return "danger";
  }

  if (numericValue >= 0.5) {
    return "warning";
  }

  return "positive";
}

function toSummaryTone(field: keyof RiskSnapshot["summary"], value: RiskSnapshot["summary"][keyof RiskSnapshot["summary"]]) {
  switch (field) {
    case "risk_level":
      return toRiskTone(String(value));
    case "blocked_actions":
      return Number(value) > 0 ? "danger" : "positive";
    case "active_alerts":
      return Number(value) > 0 ? "warning" : "positive";
    case "margin_utilization":
    case "exposure_utilization":
      return toUtilizationTone(String(value));
    default:
      return "info";
  }
}

function buildRiskStatusSummary(snapshot: RiskSnapshot | null) {
  if (!snapshot) {
    return "Awaiting the latest risk posture.";
  }

  return `${snapshot.summary.risk_level} risk, ${snapshot.summary.active_alerts} alerts, ${snapshot.summary.blocked_actions} blocked actions.`;
}

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

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle: "Risk center",
    statusSummary: buildRiskStatusSummary(snapshot),
    workbenchCopy: RISK_CENTER_COPY
  });

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title="Loading risk center" description="Loading margin and risk controls." />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Risk center unavailable" description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title="Loading risk center" description="Waiting for risk state." />;
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
    <div className="resource-stack risk-command-center">
      <SectionPanel
        description={RISK_CENTER_COPY}
        eyebrow="Immediate guardrail posture"
        meta={lastUpdated}
        signal={<SignalPill detail="risk level" label={snapshot.summary.risk_level} tone={toRiskTone(snapshot.summary.risk_level)} />}
        title="Risk center"
      >
        {snapshot.partial ? <p className="resource-alert">Showing the latest partial snapshot.</p> : null}
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
        description="Projected alerts are listed as a live operator stream for attention and escalation."
        eyebrow="Alert stream"
        title="Risk events"
      >
        {snapshot.events.length === 0 ? (
          <p className="resource-filter-empty">No active risk events are currently projected.</p>
        ) : (
          <ul style={DETAIL_LIST_STYLE}>
            {snapshot.events.map((event) => (
              <li
                key={event.event_id}
                style={{
                  ...DETAIL_CARD_STYLE,
                  borderColor:
                    event.severity === "critical"
                      ? "rgba(255, 157, 147, 0.24)"
                      : event.severity === "warn"
                        ? "rgba(255, 210, 127, 0.22)"
                        : "var(--border-subtle)"
                }}
              >
                <div style={DETAIL_HEADER_STYLE}>
                  <p style={DETAIL_TIME_STYLE}>{formatTerminalTimestamp(event.occurred_at)}</p>
                  <SignalPill label={event.severity} tone={toEventTone(event.severity)} />
                </div>
                <p className="audit-item-command">{event.title}</p>
                <p className="command-receipt-copy">{event.message}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel
        description="Active blocks are shown as hard constraints that bound what operators can do locally."
        eyebrow="Hard constraints"
        title="Active blocks"
      >
        {snapshot.blocks.length === 0 ? (
          <p className="resource-filter-empty">No active risk blocks are currently projected.</p>
        ) : (
          <table aria-label="Active blocks" className="resource-table">
            <thead>
              <tr>
                <th scope="col">Scope</th>
                <th scope="col">Raised</th>
                <th scope="col">Reason</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.blocks.map((block) => (
                <tr key={block.block_id}>
                  <td>
                    <span style={CONSTRAINT_SCOPE_STYLE}>{block.scope}</span>
                  </td>
                  <td>{formatTerminalTimestamp(block.raised_at)}</td>
                  <td>{block.reason}</td>
                  <td>
                    <SignalPill label={block.status} tone={block.status === "active" ? "danger" : "positive"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionPanel>
    </div>
  );
}
