import { useQuery } from "@tanstack/react-query";

import { useAdminRuntime } from "../../app/admin-runtime";
import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import { getAuditSnapshot } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill, type SignalTone } from "../../shared/ui/signal-pill";


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
type AuditTranslator = ReturnType<typeof useI18n>["t"];

function formatTerminalTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

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

function buildAuditStatusSummary(
  t: AuditTranslator,
  receiptCount: number,
  failureCount: number,
  partial: boolean,
  errorCount: number
) {
  if (receiptCount === 0) {
    return t("pages.audit.status.awaiting");
  }

  if (partial || errorCount > 0) {
    const degradationSummary = partial
      ? t("pages.audit.status.partialProjection")
      : t("pages.audit.status.sourceErrors", {
        count: errorCount,
        noun: t(errorCount === 1 ? "pages.audit.nouns.error" : "pages.audit.nouns.errors")
      });

    if (failureCount === 0) {
      return `${degradationSummary} ${t("pages.audit.status.receiptsVisible", { count: receiptCount })}`;
    }

    return `${degradationSummary} ${t("pages.audit.status.receiptsRequireRecovery", { count: failureCount })}`;
  }

  if (failureCount === 0) {
    return t("pages.audit.status.recordedNoRecovery", { count: receiptCount });
  }

  return t("pages.audit.status.recordedRequireRecovery", { count: receiptCount, countFlagged: failureCount });
}

function buildAuditSignalDetail(t: AuditTranslator, partial: boolean, errorCount: number, failureCount: number) {
  if (partial) {
    return t("pages.audit.signal.partialSnapshot");
  }

  if (errorCount > 0) {
    return t("pages.audit.signal.sourceErrors", {
      count: errorCount,
      noun: t(errorCount === 1 ? "pages.audit.nouns.error" : "pages.audit.nouns.errors")
    });
  }

  if (failureCount > 0) {
    return t("pages.audit.signal.flagged", { count: failureCount });
  }

  return t("pages.audit.signal.allCurrent");
}

function buildAuditSignalTone(partial: boolean, errorCount: number, failureCount: number): SignalTone {
  if (partial || errorCount > 0 || failureCount > 0) {
    return "warning";
  }

  return "info";
}

export function AuditTimeline() {
  const { connectionState, error: runtimeError } = useAdminRuntime();
  const { t } = useI18n();
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
  const sectionErrors = snapshot?.errors ?? [];
  const auditTimelineCopy = t("pages.audit.copy");
  const pageTitle = t("pages.audit.title");

  useWorkbenchShellMeta({
    lastUpdated: snapshot?.generated_at ?? null,
    pageTitle,
    statusSummary: buildAuditStatusSummary(t, receiptCount, failureCount, snapshot?.partial ?? false, sectionErrors.length),
    workbenchCopy: auditTimelineCopy
  });

  if (query.isLoading && !snapshot) {
    return <PageState kind="loading" title={pageTitle} description={t("pages.audit.pageState.loadingDescription")} />;
  }

  if (error && !snapshot) {
    return <PageState kind="error" title={pageTitle} description={error} />;
  }

  if (!snapshot) {
    return <PageState kind="loading" title={pageTitle} description={t("pages.audit.pageState.waitingDescription")} />;
  }

  if (snapshot.items.length === 0) {
    return (
      <PageState
        kind="empty"
        title={pageTitle}
        description={t("pages.audit.pageState.emptyDescription")}
        meta={lastUpdated}
      />
    );
  }

  return (
    <SectionPanel
      description={auditTimelineCopy}
      eyebrow={t("pages.audit.panelEyebrow")}
      meta={lastUpdated}
      signal={
        <SignalPill
          detail={buildAuditSignalDetail(t, snapshot.partial, sectionErrors.length, failureCount)}
          label={t("pages.audit.signal.receipts", { count: receiptCount })}
          tone={buildAuditSignalTone(snapshot.partial, sectionErrors.length, failureCount)}
        />
      }
      title={pageTitle}
    >
      {snapshot.partial ? <p className="resource-alert">{t("pages.audit.alerts.partialSnapshot")}</p> : null}
      {hasCachedError ? <p className="resource-alert">{error}</p> : null}
      {renderResourceErrors(sectionErrors)}
      <ol style={RECEIPT_LIST_STYLE}>
        {snapshot.items.map((record) => (
          <li key={`${record.command_id}:${record.sequence_id}`} style={RECEIPT_ITEM_STYLE}>
            <div style={RECEIPT_HEADER_STYLE}>
              <p style={RECEIPT_LABEL_STYLE}>{t("pages.audit.fields.receipt", { sequenceId: record.sequence_id })}</p>
              <span className="audit-status" data-status={record.status}>
                {record.status}
              </span>
            </div>
            <dl style={RECEIPT_GRID_STYLE}>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>{t("pages.audit.fields.command")}</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{record.command}</dd>
              </div>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>{t("pages.audit.fields.target")}</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{record.target ?? t("pages.audit.fields.noTargetRecorded")}</dd>
              </div>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>{t("pages.audit.fields.resultState")}</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{record.status}</dd>
              </div>
              <div style={RECEIPT_GRID_GROUP_STYLE}>
                <dt style={RECEIPT_META_LABEL_STYLE}>{t("pages.audit.fields.recorded")}</dt>
                <dd style={RECEIPT_META_VALUE_STYLE}>{formatTerminalTimestamp(record.recorded_at)}</dd>
              </div>
            </dl>
            {record.message ? <p className="command-receipt-copy">{record.message}</p> : null}
            {record.failure ? (
              <div style={RECEIPT_GUIDANCE_STYLE}>
                <p style={RECEIPT_GUIDANCE_TITLE_STYLE}>{t("pages.audit.recovery.title")}</p>
                <p className="command-receipt-copy">
                  {t("pages.audit.recovery.description")}
                </p>
                <a href="/config" style={RECEIPT_LINK_STYLE}>
                  {t("pages.audit.recovery.link")}
                </a>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionPanel>
  );
}
