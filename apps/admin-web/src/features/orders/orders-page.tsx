import { useQuery } from "@tanstack/react-query";

import { getOrdersSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { OrderSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const ORDER_COLUMNS = [
  {
    header: "Order",
    render: (order: OrderSummary) => order.client_order_id
  },
  {
    header: "Instrument",
    render: (order: OrderSummary) => order.instrument_id
  },
  {
    header: "Side",
    render: (order: OrderSummary) => order.side
  },
  {
    header: "Quantity",
    render: (order: OrderSummary) => order.quantity
  },
  {
    header: "Status",
    render: (order: OrderSummary) => order.status
  }
] as const;

export function OrdersPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.orders(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getOrdersSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={ORDER_COLUMNS}
      emptyDescription="No orders are currently reported by the admin API."
      getRowKey={(order) => order.client_order_id}
      loadingDescription="Loading the latest order diagnostics."
      query={query}
      tableLabel="Orders"
      title="Orders"
    />
  );
}
