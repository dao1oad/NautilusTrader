import { useQuery } from "@tanstack/react-query";

import { getPositionsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { PositionSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const POSITION_COLUMNS = [
  {
    header: "Instrument",
    render: (position: PositionSummary) => position.instrument_id
  },
  {
    header: "Side",
    render: (position: PositionSummary) => position.side
  },
  {
    header: "Quantity",
    render: (position: PositionSummary) => position.quantity
  }
] as const;

export function PositionsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.positions(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getPositionsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={POSITION_COLUMNS}
      emptyDescription="No positions are currently reported by the admin API."
      getRowKey={(position, index) => `${position.instrument_id}:${position.side}:${index}`}
      loadingDescription="Loading the latest position diagnostics."
      query={query}
      tableLabel="Positions"
      title="Positions"
    />
  );
}
