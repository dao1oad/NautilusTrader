import {
  resolveFreshestWorkbenchTimestamp,
  useWorkbenchShellMeta
} from "../../app/workbench-shell-meta";
import {
  getLocalizedRouteLabel,
  getLocalizedWorkbenchLabel
} from "../../app/workbench-route-catalog";
import { useI18n } from "../../shared/i18n/use-i18n";
import type {
  AuditSnapshot,
  ConnectionState,
  OverviewSnapshot,
  RiskSnapshot
} from "../../shared/types/admin";
import { ActivityRail, type ActivityRailItem } from "../../shared/ui/activity-rail";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";
import { MetricTile } from "../../shared/ui/metric-tile";
import { PageState } from "../../shared/ui/page-state";
import { SectionPanel } from "../../shared/ui/section-panel";
import { SignalPill, type SignalTone } from "../../shared/ui/signal-pill";
import { WorkbenchHeader } from "../../shared/ui/workbench-header";
import type { WorkspaceRecentRoute } from "../../shared/workspaces/workspace-store";

const MAX_ACTIVITY_ITEMS = 4;
type OverviewTranslator = ReturnType<typeof useI18n>["t"];
type ActivitySourceId = "auditTimeline" | "localRouteMemory" | "pending";

type Props = {
  auditSnapshot?: AuditSnapshot | null;
  connectionState?: ConnectionState;
  error?: string | null;
  isLoading?: boolean;
  recentRoutes?: WorkspaceRecentRoute[];
  riskSnapshot?: RiskSnapshot | null;
  snapshot?: OverviewSnapshot | null;
};

function toNodeTone(status: OverviewSnapshot["node"]["status"]): SignalTone {
  switch (status) {
    case "running":
      return "positive";
    case "error":
      return "danger";
    case "stopped":
      return "warning";
    default:
      return "info";
  }
}

function toRiskTone(riskLevel: string): SignalTone {
  const normalizedRiskLevel = riskLevel.trim().toLowerCase();

  if (normalizedRiskLevel.includes("critical") || normalizedRiskLevel.includes("high")) {
    return "danger";
  }

  if (normalizedRiskLevel.includes("elevated") || normalizedRiskLevel.includes("warn")) {
    return "warning";
  }

  if (normalizedRiskLevel.includes("normal") || normalizedRiskLevel.includes("low")) {
    return "positive";
  }

  return "info";
}

function toActivityTone(status: AuditSnapshot["items"][number]["status"]): SignalTone {
  switch (status) {
    case "completed":
      return "positive";
    case "failed":
      return "danger";
    default:
      return "info";
  }
}

function buildActivityRailState(
  t: OverviewTranslator,
  auditSnapshot: AuditSnapshot | null | undefined,
  recentRoutes: WorkspaceRecentRoute[],
): {
  items: ActivityRailItem[];
  sourceId: ActivitySourceId;
  sourceLabel: string;
  sourceTone: SignalTone;
} {
  if (Array.isArray(auditSnapshot?.items) && auditSnapshot.items.length > 0) {
    return {
      items: auditSnapshot.items.slice(0, MAX_ACTIVITY_ITEMS).map((record) => ({
        id: `${record.command_id}:${record.sequence_id}`,
        meta: record.message ?? t("overview.fallback.statusMeta", { status: record.status }),
        summary: record.target ?? t("overview.fallback.noTargetRecorded"),
        timestamp: record.recorded_at,
        title: record.command,
        tone: toActivityTone(record.status)
      })),
      sourceId: "auditTimeline",
      sourceLabel: t("overview.activitySource.auditTimeline"),
      sourceTone: "info"
    };
  }

  if (recentRoutes.length > 0) {
    return {
      items: recentRoutes.slice(0, MAX_ACTIVITY_ITEMS).map((route) => ({
        href: route.to,
        id: `${route.to}:${route.visitedAt}`,
        meta: `${getLocalizedWorkbenchLabel(t, route.workbench)} ${t("chrome.workbench")}`,
        summary: route.to,
        timestamp: route.visitedAt,
        title: getLocalizedRouteLabel(t, route.to, route.label),
        tone: "neutral"
      })),
      sourceId: "localRouteMemory",
      sourceLabel: t("overview.activitySource.localRouteMemory"),
      sourceTone: "neutral"
    };
  }

  return {
    items: [],
    sourceId: "pending",
    sourceLabel: t("overview.activitySource.pending"),
    sourceTone: "neutral"
  };
}

function buildActivitySourceSummary(
  t: OverviewTranslator,
  activityCount: number,
  sourceId: ActivitySourceId
): string | null {
  if (activityCount === 0) {
    return null;
  }

  return t(`overview.status.sourceSummary.${sourceId}`, { count: activityCount });
}

function buildStatusSummary(
  t: OverviewTranslator,
  snapshot: OverviewSnapshot | null | undefined,
  riskSnapshot: RiskSnapshot | null | undefined,
  activityCount: number,
  activitySourceId: ActivitySourceId,
) {
  if (!snapshot) {
    return t("overview.status.awaitingRuntimeSummary");
  }

  const sourceSummary = buildActivitySourceSummary(t, activityCount, activitySourceId);

  if (!riskSnapshot) {
    return [
      t("overview.status.node", { status: snapshot.node.status }),
      t("overview.status.riskPending"),
      sourceSummary
    ].filter(Boolean).join(" ");
  }

  return [
    t("overview.status.node", { status: snapshot.node.status }),
    t("overview.status.risk", {
      riskLevel: riskSnapshot.summary.risk_level,
      activeAlerts: riskSnapshot.summary.active_alerts,
      blockedActions: riskSnapshot.summary.blocked_actions
    }),
    sourceSummary
  ].filter(Boolean).join(" ");
}

export function OverviewPage({
  auditSnapshot,
  connectionState,
  snapshot,
  error,
  isLoading = false,
  recentRoutes = [],
  riskSnapshot
}: Props = {}) {
  const { t } = useI18n();
  const hasCachedError = Boolean(error) && Boolean(snapshot);
  const isStale = connectionState === "stale" || snapshot?.stale === true || hasCachedError;
  const freshestTimestamp = resolveFreshestWorkbenchTimestamp(
    snapshot?.generated_at,
    riskSnapshot?.generated_at,
    auditSnapshot?.generated_at
  );
  const lastUpdated = freshestTimestamp ? <LastUpdatedBadge stale={isStale} timestamp={freshestTimestamp} /> : null;
  const activityRail = buildActivityRailState(t, auditSnapshot, recentRoutes);
  const statusSummary = buildStatusSummary(t, snapshot, riskSnapshot, activityRail.items.length, activityRail.sourceId);
  const nodeTone = snapshot ? toNodeTone(snapshot.node.status) : "neutral";
  const riskTone = riskSnapshot ? toRiskTone(riskSnapshot.summary.risk_level) : "neutral";
  const commandCenterTitle = t("overview.commandCenter.title");
  const commandCenterDescription = t("overview.commandCenter.description");

  useWorkbenchShellMeta({
    lastUpdated: freshestTimestamp,
    pageTitle: commandCenterTitle,
    statusSummary,
    workbenchCopy: commandCenterDescription
  });

  if (isLoading && !snapshot) {
    return (
      <PageState
        kind="loading"
        title={t("overview.pageState.loadingTitle")}
        description={t("overview.pageState.loadingDescription")}
      />
    );
  }

  if (error && !snapshot) {
    return <PageState kind="error" title={t("overview.pageState.unavailableTitle")} description={error} />;
  }

  if (!snapshot && connectionState === "stale") {
    return (
      <PageState
        kind="stale"
        title={t("overview.pageState.connectionStaleTitle")}
        description={t("overview.pageState.loadingDescription")}
      />
    );
  }

  if (!snapshot && connectionState === "disconnected") {
    return (
      <PageState
        kind="stale"
        title={t("overview.pageState.disconnectedTitle")}
        description={t("overview.pageState.disconnectedDescription")}
      />
    );
  }

  if (!snapshot) {
    return (
      <PageState
        kind="loading"
        title={t("overview.pageState.loadingTitle")}
        description={t("overview.pageState.loadingDescription")}
      />
    );
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title={hasCachedError ? t("overview.pageState.refreshFailedTitle") : t("overview.pageState.connectionStaleTitle")}
        description={error ?? t("overview.pageState.staleDescription")}
        meta={lastUpdated}
      />
    );
  }

  if (snapshot.node.status === "not_configured") {
    return (
      <PageState
        kind="empty"
        title={t("overview.pageState.noLiveNodeTitle")}
        description={t("overview.pageState.noLiveNodeDescription")}
        meta={lastUpdated}
      />
    );
  }

  return (
    <section className="overview-command-center">
      <WorkbenchHeader
        description={commandCenterDescription}
        summary={statusSummary}
        title={commandCenterTitle}
      >
        <SignalPill
          detail={snapshot.node.node_id ?? t("overview.signal.noNodeId")}
          label={t("overview.signal.nodeLabel", { status: snapshot.node.status })}
          tone={nodeTone}
        />
        {riskSnapshot ? (
          <SignalPill
            detail={t("overview.signal.alertsDetail", { count: riskSnapshot.summary.active_alerts })}
            label={t("overview.signal.riskLabel", { riskLevel: riskSnapshot.summary.risk_level })}
            tone={riskTone}
          />
        ) : null}
        <SignalPill
          detail={t("overview.signal.itemsDetail", { count: activityRail.items.length })}
          label={activityRail.sourceLabel}
          tone={activityRail.sourceTone}
        />
        {lastUpdated}
      </WorkbenchHeader>

      {snapshot.partial ? (
        <p className="resource-alert">{t("overview.alerts.partialRuntimeSnapshot")}</p>
      ) : null}
      {isStale ? (
        <p className="resource-alert">
          {error ?? t("overview.pageState.staleDescription")}
        </p>
      ) : null}

      <div className="overview-command-grid">
        <div className="overview-main-stack">
          <SectionPanel
            description={t("overview.runtimeSummary.description")}
            title={t("overview.runtimeSummary.title")}
          >
            <div className="overview-metric-grid">
              <MetricTile
                detail={
                  snapshot.node.node_id
                    ? t("overview.runtimeSummary.connectedNodeDetail")
                    : t("overview.runtimeSummary.nodeIdPendingDetail")
                }
                label={t("overview.runtimeSummary.nodeStatusLabel")}
                meta={snapshot.node.node_id ?? t("pages.nodes.unassigned")}
                tone={nodeTone}
                value={snapshot.node.status}
              />
              <MetricTile
                detail={t("overview.runtimeSummary.activeStrategiesDetail", {
                  count: snapshot.strategies.filter((strategy) => strategy.status === "running").length
                })}
                label={t("overview.runtimeSummary.activeStrategiesLabel")}
                meta={t("overview.runtimeSummary.activeStrategiesMeta")}
                tone="info"
                value={snapshot.strategies.length}
              />
              <MetricTile
                detail={t("overview.runtimeSummary.adapterLinksDetail")}
                label={t("overview.runtimeSummary.adapterLinksLabel")}
                meta={t("overview.runtimeSummary.adapterLinksMeta", {
                  count: snapshot.adapters.filter((adapter) => adapter.status === "connected").length
                })}
                tone="info"
                value={snapshot.adapters.length}
              />
              <MetricTile
                detail={t("overview.runtimeSummary.accountsDetail")}
                label={t("overview.runtimeSummary.accountsLabel")}
                meta={t("overview.runtimeSummary.accountsMeta")}
                tone="neutral"
                value={snapshot.accounts.length}
              />
              <MetricTile
                detail={t("overview.runtimeSummary.openPositionsDetail")}
                label={t("overview.runtimeSummary.openPositionsLabel")}
                meta={t("overview.runtimeSummary.openPositionsMeta")}
                tone="warning"
                value={snapshot.positions.length}
              />
            </div>
          </SectionPanel>

          <SectionPanel
            description={t("overview.riskSnapshot.description")}
            title={t("overview.riskSnapshot.title")}
          >
            {riskSnapshot ? (
              <div className="overview-risk-stack">
                <div className="overview-metric-grid">
                  <MetricTile
                    detail={t("overview.riskSnapshot.tradingStateDetail")}
                    label={t("overview.riskSnapshot.tradingStateLabel")}
                    meta={t("overview.riskSnapshot.tradingStateMeta")}
                    tone={riskTone}
                    value={riskSnapshot.summary.trading_state}
                  />
                  <MetricTile
                    detail={t("overview.riskSnapshot.riskLevelDetail")}
                    label={t("overview.riskSnapshot.riskLevelLabel")}
                    meta={t("overview.riskSnapshot.riskLevelMeta")}
                    tone={riskTone}
                    value={riskSnapshot.summary.risk_level}
                  />
                  <MetricTile
                    detail={riskSnapshot.summary.margin_utilization}
                    label={t("overview.riskSnapshot.activeAlertsLabel")}
                    meta={t("overview.riskSnapshot.activeAlertsMeta")}
                    tone="warning"
                    value={riskSnapshot.summary.active_alerts}
                  />
                  <MetricTile
                    detail={riskSnapshot.summary.exposure_utilization}
                    label={t("overview.riskSnapshot.blockedActionsLabel")}
                    meta={t("overview.riskSnapshot.blockedActionsMeta")}
                    tone={riskSnapshot.summary.blocked_actions > 0 ? "danger" : "positive"}
                    value={riskSnapshot.summary.blocked_actions}
                  />
                </div>
                <div className="detail-list">
                  <div className="audit-item">
                    <h3>{t("overview.riskSnapshot.latestAlertTitle")}</h3>
                    {riskSnapshot.events.length > 0 ? (
                      <>
                        <p className="audit-item-command">{riskSnapshot.events[0].title}</p>
                        <p className="command-receipt-copy">{riskSnapshot.events[0].message}</p>
                      </>
                    ) : (
                      <p className="command-receipt-copy">{t("overview.riskSnapshot.noLiveAlerts")}</p>
                    )}
                  </div>
                  <div className="audit-item">
                    <h3>{t("overview.riskSnapshot.latestBlockTitle")}</h3>
                    {riskSnapshot.blocks.length > 0 ? (
                      <>
                        <p className="audit-item-command">{riskSnapshot.blocks[0].reason}</p>
                        <p className="command-receipt-copy">{riskSnapshot.blocks[0].scope}</p>
                      </>
                    ) : (
                      <p className="command-receipt-copy">{t("overview.riskSnapshot.noActiveBlocks")}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="command-receipt-copy">{t("overview.riskSnapshot.unavailable")}</p>
            )}
          </SectionPanel>
        </div>

        <ActivityRail
          description={t("overview.activity.description")}
          emptyState={t("overview.activity.emptyState")}
          items={activityRail.items}
          sourceLabel={activityRail.sourceLabel}
          sourceTone={activityRail.sourceTone}
          title={t("overview.activity.title")}
        />
      </div>
    </section>
  );
}
