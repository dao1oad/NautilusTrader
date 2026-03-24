import { useQuery } from "@tanstack/react-query";

import { OverviewPage } from "../../features/overview/overview-page";
import { getOverviewSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import { useAdminRuntime } from "../admin-runtime";


export function OverviewRoutePage() {
  const { connectionState, error } = useAdminRuntime();
  const overviewQuery = useQuery({
    queryKey: adminQueryKeys.overview(),
    queryFn: getOverviewSnapshot
  });

  return (
    <OverviewPage
      connectionState={connectionState}
      error={error ?? (overviewQuery.error instanceof Error ? overviewQuery.error.message : null)}
      isLoading={overviewQuery.isPending}
      snapshot={overviewQuery.data ?? null}
    />
  );
}
