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
        meta: record.message ?? `Status ${record.status}`,
        summary: record.target ?? "No target recorded",
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
        title="Loading overview"
        description="Waiting for the latest admin snapshot."
      />
    );
  }

  if (error && !snapshot) {
    return <PageState kind="error" title="Overview unavailable" description={error} />;
  }

  if (!snapshot && connectionState === "stale") {
    return (
      <PageState
        kind="stale"
        title="Connection stale"
        description="Waiting for a fresh admin snapshot."
      />
    );
  }

  if (!snapshot && connectionState === "disconnected") {
    return (
      <PageState
        kind="stale"
        title="Disconnected from admin API"
        description="Reconnect the admin API to refresh runtime state."
      />
    );
  }

  if (!snapshot) {
    return (
      <PageState
        kind="loading"
        title="Loading overview"
        description="Waiting for the latest admin snapshot."
      />
    );
  }

  if (isStale) {
    return (
      <PageState
        kind="stale"
        title={hasCachedError ? "Overview refresh failed" : "Connection stale"}
        description={error ?? "Showing the last successfully received admin snapshot."}
        meta={lastUpdated}
      />
    );
  }

  if (snapshot.node.status === "not_configured") {
    return (
      <PageState
        kind="empty"
        title="No live node configured"
        description="Connect a live node to populate runtime operations data."
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
          detail={snapshot.node.node_id ?? "No node id"}
          label={`Node ${snapshot.node.status}`}
          tone={nodeTone}
        />
        {riskSnapshot ? (
          <SignalPill
            detail={`${riskSnapshot.summary.active_alerts} alerts`}
            label={`Risk ${riskSnapshot.summary.risk_level}`}
            tone={riskTone}
          />
        ) : null}
        <SignalPill
          detail={`${activityRail.items.length} items`}
          label={activityRail.sourceLabel}
          tone={activityRail.sourceTone}
        />
        {lastUpdated}
      </WorkbenchHeader>

      {snapshot.partial ? (
        <p className="resource-alert">Showing the latest partial runtime snapshot.</p>
      ) : null}
      {isStale ? (
        <p className="resource-alert">
          {error ?? "Snapshot refresh is delayed. Showing the freshest available command-center data."}
        </p>
      ) : null}

      <div className="overview-command-grid">
        <div className="overview-main-stack">
          <SectionPanel
            description="Runtime breadth across live strategies, adapters, accounts, and open positions."
            title="Runtime summary"
          >
            <div className="overview-metric-grid">
              <MetricTile
                detail={snapshot.node.node_id ? "Connected node" : "Node id pending"}
                label="Node status"
                meta={snapshot.node.node_id ?? "Unassigned"}
                tone={nodeTone}
                value={snapshot.node.status}
              />
              <MetricTile
                detail={`${snapshot.strategies.filter((strategy) => strategy.status === "running").length} running`}
                label="Active strategies"
                meta="Supervised strategies"
                tone="info"
                value={snapshot.strategies.length}
              />
              <MetricTile
                detail="Bounded venue adapters"
                label="Adapter links"
                meta={`${snapshot.adapters.filter((adapter) => adapter.status === "connected").length} connected`}
                tone="info"
                value={snapshot.adapters.length}
              />
              <MetricTile
                detail="Accounts projected into the shell"
                label="Accounts"
                meta="Balances and exposures"
                tone="neutral"
                value={snapshot.accounts.length}
              />
              <MetricTile
                detail="Projected live positions"
                label="Open positions"
                meta="Cross-venue exposure"
                tone="warning"
                value={snapshot.positions.length}
              />
            </div>
          </SectionPanel>

          <SectionPanel
            description="Cross-account guardrails, live alerts, and the latest operator blocks."
            title="Risk snapshot"
          >
            {riskSnapshot ? (
              <div className="overview-risk-stack">
                <div className="overview-metric-grid">
                  <MetricTile
                    detail="Operator gate status"
                    label="Trading state"
                    meta="Risk coordinator"
                    tone={riskTone}
                    value={riskSnapshot.summary.trading_state}
                  />
                  <MetricTile
                    detail="Current posture"
                    label="Risk level"
                    meta="Margin and exposure"
                    tone={riskTone}
                    value={riskSnapshot.summary.risk_level}
                  />
                  <MetricTile
                    detail={riskSnapshot.summary.margin_utilization}
                    label="Active alerts"
                    meta="Margin utilization"
                    tone="warning"
                    value={riskSnapshot.summary.active_alerts}
                  />
                  <MetricTile
                    detail={riskSnapshot.summary.exposure_utilization}
                    label="Blocked actions"
                    meta="Exposure utilization"
                    tone={riskSnapshot.summary.blocked_actions > 0 ? "danger" : "positive"}
                    value={riskSnapshot.summary.blocked_actions}
                  />
                </div>
                <div className="detail-list">
                  <div className="audit-item">
                    <h3>Latest alert</h3>
                    {riskSnapshot.events.length > 0 ? (
                      <>
                        <p className="audit-item-command">{riskSnapshot.events[0].title}</p>
                        <p className="command-receipt-copy">{riskSnapshot.events[0].message}</p>
                      </>
                    ) : (
                      <p className="command-receipt-copy">No live risk alerts are currently projected.</p>
                    )}
                  </div>
                  <div className="audit-item">
                    <h3>Latest block</h3>
                    {riskSnapshot.blocks.length > 0 ? (
                      <>
                        <p className="audit-item-command">{riskSnapshot.blocks[0].reason}</p>
                        <p className="command-receipt-copy">{riskSnapshot.blocks[0].scope}</p>
                      </>
                    ) : (
                      <p className="command-receipt-copy">No operator blocks are currently active.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="command-receipt-copy">Risk snapshot is not available yet.</p>
            )}
          </SectionPanel>
        </div>

        <ActivityRail
          description="Latest control receipts, with local route memory as the quiet-state fallback."
          emptyState="No audit activity or local route history is available yet."
          items={activityRail.items}
          sourceLabel={activityRail.sourceLabel}
          sourceTone={activityRail.sourceTone}
          title="Recent activity"
        />
      </div>
    </section>
  );
}
