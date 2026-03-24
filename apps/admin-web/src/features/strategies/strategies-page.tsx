import { useQuery } from "@tanstack/react-query";

import { getStrategiesSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { StrategySummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const STRATEGY_COLUMNS = [
  {
    header: "Strategy",
    render: (strategy: StrategySummary) => strategy.strategy_id
  },
  {
    header: "Status",
    render: (strategy: StrategySummary) => strategy.status
  }
] as const;

export function StrategiesPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.strategies(),
    queryFn: getStrategiesSnapshot
  });

  return (
    <AdminListPage
      columns={STRATEGY_COLUMNS}
      emptyDescription="No strategies are currently reported by the admin API."
      getRowKey={(strategy) => strategy.strategy_id}
      loadingDescription="Loading the latest strategy diagnostics."
      query={query}
      tableLabel="Strategies"
      title="Strategies"
    />
  );
}
