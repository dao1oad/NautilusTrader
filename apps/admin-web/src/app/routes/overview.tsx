import { useQuery } from "@tanstack/react-query";

import { OverviewPage } from "../../features/overview/overview-page";
import * as adminClient from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AuditSnapshot, RiskSnapshot } from "../../shared/types/admin";
import { readWorkspaceState } from "../../shared/workspaces/workspace-store";
import { useAdminRuntime } from "../admin-runtime";


function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

async function getOptionalRiskSnapshot(): Promise<RiskSnapshot | null> {
  try {
    return typeof adminClient.getRiskSnapshot === "function" ? adminClient.getRiskSnapshot() : null;
  } catch {
    return null;
  }
}

async function getOptionalAuditSnapshot(): Promise<AuditSnapshot | null> {
  try {
    return typeof adminClient.getAuditSnapshot === "function" ? adminClient.getAuditSnapshot() : null;
  } catch {
    return null;
  }
}

function isRiskSnapshot(snapshot: unknown): snapshot is RiskSnapshot {
  return Boolean(
    snapshot &&
    typeof snapshot === "object" &&
    "generated_at" in snapshot &&
    "summary" in snapshot
  );
}

function isAuditSnapshot(snapshot: unknown): snapshot is AuditSnapshot {
  return Boolean(
    snapshot &&
    typeof snapshot === "object" &&
    "generated_at" in snapshot &&
    Array.isArray((snapshot as AuditSnapshot).items)
  );
}

export function OverviewRoutePage() {
  const { connectionState, error } = useAdminRuntime();
  const overviewQuery = useQuery({
    queryKey: adminQueryKeys.overview(),
    queryFn: adminClient.getOverviewSnapshot
  });
  const riskQuery = useQuery({
    queryKey: adminQueryKeys.risk(),
    queryFn: getOptionalRiskSnapshot
  });
  const auditQuery = useQuery({
    queryKey: adminQueryKeys.audit(),
    queryFn: getOptionalAuditSnapshot
  });
  const workspaceState = readWorkspaceState(getBrowserStorage());
  const riskSnapshot = isRiskSnapshot(riskQuery.data) ? riskQuery.data : null;
  const auditSnapshot = isAuditSnapshot(auditQuery.data) ? auditQuery.data : null;

  return (
    <OverviewPage
      connectionState={connectionState}
      error={error ?? (overviewQuery.error instanceof Error ? overviewQuery.error.message : null)}
      auditSnapshot={auditSnapshot}
      isLoading={overviewQuery.isPending}
      recentRoutes={workspaceState.recentRoutes}
      riskSnapshot={riskSnapshot}
      snapshot={overviewQuery.data ?? null}
    />
  );
}
