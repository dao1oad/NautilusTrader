import { useQuery } from "@tanstack/react-query";

import { getPositionsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { PositionSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const TRADING_PAGE_SIZE = 25;
type PositionsTranslator = ReturnType<typeof useI18n>["t"];

function buildPositionColumns(t: PositionsTranslator) {
  return [
    {
      header: t("pages.positions.columns.instrument"),
      render: (position: PositionSummary) => position.instrument_id
    },
    {
      header: t("pages.positions.columns.side"),
      render: (position: PositionSummary) => position.side
    },
    {
      header: t("pages.positions.columns.quantity"),
      render: (position: PositionSummary) => position.quantity
    }
  ] as const;
}

type PositionDetailField = {
  label: string;
  value: string | null | undefined;
  fallback: string;
};

function renderPositionDrillDown(t: PositionsTranslator, position: PositionSummary) {
  const detailFields: PositionDetailField[] = [
    { label: t("pages.positions.details.position"), value: position.position_id, fallback: t("pages.positions.unavailable") },
    { label: t("pages.positions.details.instrument"), value: position.instrument_id, fallback: t("pages.positions.unavailable") },
    { label: t("pages.positions.details.side"), value: position.side, fallback: t("pages.positions.unavailable") },
    { label: t("pages.positions.details.quantity"), value: position.quantity, fallback: t("pages.positions.unavailable") },
    { label: t("pages.positions.details.entryPrice"), value: position.entry_price, fallback: t("pages.positions.unavailable") },
    {
      label: t("pages.positions.details.unrealizedPnl"),
      value: position.unrealized_pnl,
      fallback: t("pages.positions.unavailable")
    },
    {
      label: t("pages.positions.details.realizedPnl"),
      value: position.realized_pnl,
      fallback: t("pages.positions.unavailable")
    },
    { label: t("pages.positions.details.openedAt"), value: position.opened_at, fallback: t("pages.positions.unavailable") },
    { label: t("pages.positions.details.updatedAt"), value: position.updated_at, fallback: t("pages.positions.unavailable") }
  ];

  return (
    <dl className="resource-detail-grid">
      {detailFields.map((field) => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd>{field.value ?? field.fallback}</dd>
        </div>
      ))}
    </dl>
  );
}

function getPositionSearchText(position: PositionSummary) {
  return [
    position.position_id ?? "",
    position.instrument_id,
    position.side,
    position.quantity,
    position.entry_price ?? "",
    position.unrealized_pnl ?? "",
    position.realized_pnl ?? "",
    position.opened_at ?? "",
    position.updated_at ?? ""
  ].join(" ");
}

function getPositionRowKey(position: PositionSummary, _index: number) {
  if (position.position_id) {
    return position.position_id;
  }

  return position.opened_at
    ? [position.instrument_id, position.side, position.opened_at].join(":")
    : [position.instrument_id, position.side].join(":");
}

export function PositionsPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.positions(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getPositionsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={buildPositionColumns(t)}
      emptyDescription={t("pages.positions.emptyDescription")}
      filter={{
        getSearchText: getPositionSearchText,
        placeholder: t("pages.positions.filterPlaceholder")
      }}
      getRowKey={getPositionRowKey}
      loadingDescription={t("pages.positions.loadingDescription")}
      pagination={{ pageSize: TRADING_PAGE_SIZE }}
      query={query}
      summaryCopy={t("pages.positions.summaryCopy")}
      tableLabel={t("pages.positions.tableLabel")}
      title={t("pages.positions.title")}
      drillDown={{
        title: t("pages.positions.drillDownTitle"),
        getButtonLabel: (position, _index, expanded) =>
          expanded
            ? t("pages.positions.hideDetails", { instrumentId: position.instrument_id })
            : t("pages.positions.viewDetails", { instrumentId: position.instrument_id }),
        render: (position) => renderPositionDrillDown(t, position)
      }}
    />
  );
}
