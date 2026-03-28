import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getConfigDiffSnapshot } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill } from "../../shared/ui/signal-pill";


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
type ConfigTranslator = ReturnType<typeof useI18n>["t"];

function buildConfigStatusSummary(t: ConfigTranslator, totalChecks: number, driftedChecks: number, runbookCount: number) {
  if (totalChecks === 0) {
    return t("pages.config.status.awaiting");
  }

  if (driftedChecks === 0) {
    return t("pages.config.status.inSync", { totalChecks, runbookCount });
  }

  return t("pages.config.status.drifted", { driftedChecks, totalChecks, runbookCount });
}

export function ConfigDiffPage() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const { t } = useI18n();
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
  const configDiffCopy = t("pages.config.copy");
  const pageTitle = t("pages.config.title");

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle,
    statusSummary: buildConfigStatusSummary(t, snapshot?.items.length ?? 0, driftedChecks, runbookCount),
    workbenchCopy: configDiffCopy
  });

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title={pageTitle} description={t("pages.config.pageState.loadingDescription")} />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title={pageTitle} description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title={pageTitle} description={t("pages.config.pageState.waitingDescription")} />;
  }

  if (snapshot.items.length === 0) {
    return (
      <PageState
        kind="empty"
        title={pageTitle}
        description={t("pages.config.pageState.emptyDescription")}
        meta={lastUpdated}
      />
    );
  }

  return (
    <div className="resource-stack config-diff-stack">
      <SectionPanel
        description={configDiffCopy}
        eyebrow={t("pages.config.ledger.eyebrow")}
        meta={lastUpdated}
        signal={
          <SignalPill
            detail={
              driftedChecks > 0
                ? t("pages.config.ledger.signalDrifted", { count: driftedChecks })
                : t("pages.config.ledger.signalInSync")
            }
            label={t("pages.config.ledger.signalChecks", { count: snapshot.items.length })}
            tone={driftedChecks > 0 ? "warning" : "positive"}
          />
        }
        title={pageTitle}
      >
        <table aria-label={t("pages.config.ledger.tableLabel")} className="resource-table config-diff-table">
          <thead>
            <tr>
              <th scope="col">{t("pages.config.ledger.columns.key")}</th>
              <th scope="col">{t("pages.config.ledger.columns.desired")}</th>
              <th scope="col">{t("pages.config.ledger.columns.actual")}</th>
              <th scope="col">{t("pages.config.ledger.columns.status")}</th>
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
        description={t("pages.config.runbooks.description")}
        eyebrow={t("pages.config.runbooks.eyebrow")}
        signal={<SignalPill label={t("pages.config.runbooks.signal", { count: runbookCount })} tone="info" />}
        title={t("pages.config.runbooks.title")}
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
