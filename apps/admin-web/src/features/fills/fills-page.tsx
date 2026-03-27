import { useQuery } from "@tanstack/react-query";

import { getFillsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { FillSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const TRADING_PAGE_SIZE = 25;

const FILL_COLUMNS = [
  {
    header: "Fill",
    render: (fill: FillSummary) => fill.fill_id
  },
  {
    header: "Order",
    render: (fill: FillSummary) => fill.client_order_id
  },
  {
    header: "Instrument",
    render: (fill: FillSummary) => fill.instrument_id
  },
  {
    header: "Side",
    render: (fill: FillSummary) => fill.side
  },
  {
    header: "Quantity",
    render: (fill: FillSummary) => fill.quantity
  },
  {
    header: "Price",
    render: (fill: FillSummary) => fill.price
  },
  {
    header: "Liquidity",
    render: (fill: FillSummary) => fill.liquidity_side
  },
  {
    header: "Time",
    render: (fill: FillSummary) => fill.timestamp
  }
] as const;

function getFillSearchText(fill: FillSummary) {
  return [
    fill.fill_id,
    fill.client_order_id,
    fill.instrument_id,
    fill.side,
    fill.quantity,
    fill.price,
    fill.liquidity_side,
    fill.timestamp
  ].join(" ");
}

export function FillsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.fills(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getFillsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={FILL_COLUMNS}
      emptyDescription="No fills are currently reported by the admin API."
      getRowKey={(fill) => fill.fill_id}
      loadingDescription="Loading the latest fill diagnostics."
      pagination={{ pageSize: TRADING_PAGE_SIZE }}
      filter={{ getSearchText: getFillSearchText }}
      query={query}
      tableLabel="Fills"
      title="Fills"
    />
  );
}
