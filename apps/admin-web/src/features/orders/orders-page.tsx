import { useQuery } from "@tanstack/react-query";

import { getOrdersSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { OrderSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const TRADING_PAGE_SIZE = 25;
type OrdersTranslator = ReturnType<typeof useI18n>["t"];

function buildOrderColumns(t: OrdersTranslator) {
  return [
    {
      header: t("pages.orders.columns.order"),
      render: (order: OrderSummary) => order.client_order_id
    },
    {
      header: t("pages.orders.columns.instrument"),
      render: (order: OrderSummary) => order.instrument_id
    },
    {
      header: t("pages.orders.columns.side"),
      render: (order: OrderSummary) => order.side
    },
    {
      header: t("pages.orders.columns.quantity"),
      render: (order: OrderSummary) => order.quantity
    },
    {
      header: t("pages.orders.columns.status"),
      render: (order: OrderSummary) => order.status
    }
  ] as const;
}

function getOrderSearchText(order: OrderSummary) {
  return [order.client_order_id, order.instrument_id, order.side, order.quantity, order.status].join(" ");
}

export function OrdersPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.orders(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getOrdersSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={buildOrderColumns(t)}
      emptyDescription={t("pages.orders.emptyDescription")}
      filter={{
        getSearchText: getOrderSearchText,
        placeholder: t("pages.orders.filterPlaceholder")
      }}
      getRowKey={(order) => order.client_order_id}
      loadingDescription={t("pages.orders.loadingDescription")}
      pagination={{ pageSize: TRADING_PAGE_SIZE }}
      query={query}
      summaryCopy={t("pages.orders.summaryCopy")}
      tableLabel={t("pages.orders.tableLabel")}
      title={t("pages.orders.title")}
    />
  );
}
