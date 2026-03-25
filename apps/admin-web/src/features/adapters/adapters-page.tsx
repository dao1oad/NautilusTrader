import { useQuery } from "@tanstack/react-query";

import { getAdaptersSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AdapterSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const ADAPTER_COLUMNS = [
  {
    header: "Adapter",
    render: (adapter: AdapterSummary) => adapter.adapter_id
  },
  {
    header: "Status",
    render: (adapter: AdapterSummary) => adapter.status
  }
] as const;

export function AdaptersPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.adapters(),
    queryFn: getAdaptersSnapshot
  });

  return (
    <AdminListPage
      columns={ADAPTER_COLUMNS}
      emptyDescription="No adapters are currently reported by the admin API."
      getRowKey={(adapter) => adapter.adapter_id}
      loadingDescription="Loading the latest adapter diagnostics."
      query={query}
      tableLabel="Adapters"
      title="Adapters"
    />
  );
}
