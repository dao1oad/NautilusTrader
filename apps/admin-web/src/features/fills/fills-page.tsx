import { useQuery } from "@tanstack/react-query";

import { getFillsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { FillSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const TRADING_PAGE_SIZE = 25;
type FillsTranslator = ReturnType<typeof useI18n>["t"];

function buildFillColumns(t: FillsTranslator) {
  return [
    {
      header: t("pages.fills.columns.fill"),
      render: (fill: FillSummary) => fill.fill_id
    },
    {
      header: t("pages.fills.columns.order"),
      render: (fill: FillSummary) => fill.client_order_id
    },
    {
      header: t("pages.fills.columns.instrument"),
      render: (fill: FillSummary) => fill.instrument_id
    },
    {
      header: t("pages.fills.columns.side"),
      render: (fill: FillSummary) => fill.side
    },
    {
      header: t("pages.fills.columns.quantity"),
      render: (fill: FillSummary) => fill.quantity
    },
    {
      header: t("pages.fills.columns.price"),
      render: (fill: FillSummary) => fill.price
    },
    {
      header: t("pages.fills.columns.liquidity"),
      render: (fill: FillSummary) => fill.liquidity_side
    },
    {
      header: t("pages.fills.columns.time"),
      render: (fill: FillSummary) => fill.timestamp
    }
  ] as const;
}

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
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.fills(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getFillsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={buildFillColumns(t)}
      emptyDescription={t("pages.fills.emptyDescription")}
      filter={{
        getSearchText: getFillSearchText,
        placeholder: t("pages.fills.filterPlaceholder")
      }}
      getRowKey={(fill) => fill.fill_id}
      loadingDescription={t("pages.fills.loadingDescription")}
      pagination={{ pageSize: TRADING_PAGE_SIZE }}
      query={query}
      summaryCopy={t("pages.fills.summaryCopy")}
      tableLabel={t("pages.fills.tableLabel")}
      title={t("pages.fills.title")}
    />
  );
}
