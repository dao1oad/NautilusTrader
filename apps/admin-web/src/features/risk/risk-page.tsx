import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getRiskSnapshot } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { RiskSnapshot } from "../../shared/types/admin";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { MetricTile } from "../../shared/ui/metric-tile";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill, type SignalTone } from "../../shared/ui/signal-pill";


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
type RiskTranslator = ReturnType<typeof useI18n>["t"];

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

function buildRiskSummaryFields(t: RiskTranslator) {
  return [
    {
      detail: t("pages.risk.summaryFields.riskLevel.detail"),
      label: t("pages.risk.summaryFields.riskLevel.label"),
      key: "risk_level"
    },
    {
      detail: t("pages.risk.summaryFields.blockedActions.detail"),
      label: t("pages.risk.summaryFields.blockedActions.label"),
      key: "blocked_actions"
    },
    {
      detail: t("pages.risk.summaryFields.activeAlerts.detail"),
      label: t("pages.risk.summaryFields.activeAlerts.label"),
      key: "active_alerts"
    },
    {
      detail: t("pages.risk.summaryFields.tradingState.detail"),
      label: t("pages.risk.summaryFields.tradingState.label"),
      key: "trading_state"
    },
    {
      detail: t("pages.risk.summaryFields.marginUtilization.detail"),
      label: t("pages.risk.summaryFields.marginUtilization.label"),
      key: "margin_utilization"
    },
    {
      detail: t("pages.risk.summaryFields.exposureUtilization.detail"),
      label: t("pages.risk.summaryFields.exposureUtilization.label"),
      key: "exposure_utilization"
    }
  ] as const satisfies Array<{
    detail: string;
    label: string;
    key: keyof RiskSnapshot["summary"];
  }>;
}

function buildRiskStatusSummary(t: RiskTranslator, snapshot: RiskSnapshot | null) {
  if (!snapshot) {
    return t("pages.risk.status.awaiting");
  }

  return t("pages.risk.status.summary", {
    riskLevel: snapshot.summary.risk_level,
    activeAlerts: snapshot.summary.active_alerts,
    blockedActions: snapshot.summary.blocked_actions
  });
}

export function RiskPage() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.risk(),
    queryFn: getRiskSnapshot
  });

  const snapshot = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : runtimeError;
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || hasCachedError;
  const lastUpdated = snapshot ? <LastUpdatedBadge stale={isStale} timestamp={snapshot.generated_at} /> : null;
  const pageTitle = t("pages.risk.title");
  const workbenchCopy = t("pages.risk.copy");

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle,
    statusSummary: buildRiskStatusSummary(t, snapshot),
    workbenchCopy
  });

  if (query.isLoading && !snapshot) {
    return (
      <PageState
        kind="loading"
        title={t("pages.risk.pageState.loadingTitle")}
        description={t("pages.risk.pageState.loadingDescription")}
      />
    );
  }

  if (error && !snapshot) {
    return <PageState kind="error" title={t("pages.risk.pageState.unavailableTitle")} description={error} />;
  }

  if (!snapshot) {
    return (
      <PageState
        kind="loading"
        title={t("pages.risk.pageState.loadingTitle")}
        description={t("pages.risk.pageState.waitingDescription")}
      />
    );
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title={pageTitle}
        description={error ?? t("pages.risk.pageState.staleDescription")}
        meta={lastUpdated}
      />
    );
  }

  return (
    <div className="resource-stack risk-command-center">
      <SectionPanel
        description={workbenchCopy}
        eyebrow={t("pages.risk.header.eyebrow")}
        meta={lastUpdated}
        signal={
          <SignalPill
            detail={t("pages.risk.signal.detail")}
            label={snapshot.summary.risk_level}
            tone={toRiskTone(snapshot.summary.risk_level)}
          />
        }
        title={pageTitle}
      >
        {snapshot.partial ? <p className="resource-alert">{t("pages.risk.alerts.partialSnapshot")}</p> : null}
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
        <div aria-label={t("pages.risk.summaryAriaLabel")} className="metric-grid">
          {buildRiskSummaryFields(t).map((field) => (
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
        description={t("pages.risk.events.description")}
        eyebrow={t("pages.risk.events.eyebrow")}
        title={t("pages.risk.events.title")}
      >
        {snapshot.events.length === 0 ? (
          <p className="resource-filter-empty">{t("pages.risk.events.emptyDescription")}</p>
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
        description={t("pages.risk.blocks.description")}
        eyebrow={t("pages.risk.blocks.eyebrow")}
        title={t("pages.risk.blocks.title")}
      >
        {snapshot.blocks.length === 0 ? (
          <p className="resource-filter-empty">{t("pages.risk.blocks.emptyDescription")}</p>
        ) : (
          <table aria-label={t("pages.risk.blocks.tableLabel")} className="resource-table">
            <thead>
              <tr>
                <th scope="col">{t("pages.risk.blocks.columns.scope")}</th>
                <th scope="col">{t("pages.risk.blocks.columns.raised")}</th>
                <th scope="col">{t("pages.risk.blocks.columns.reason")}</th>
                <th scope="col">{t("pages.risk.blocks.columns.status")}</th>
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
