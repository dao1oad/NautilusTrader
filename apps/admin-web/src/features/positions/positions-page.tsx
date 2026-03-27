import { useQuery } from "@tanstack/react-query";

import { getPositionsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { PositionSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const TRADING_PAGE_SIZE = 25;

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

type PositionDetailField = {
  label: string;
  value: string | null | undefined;
};

function renderPositionDetailField({ label, value }: PositionDetailField) {
  return (
    <div key={label}>
      <dt>{label}</dt>
      <dd>{value ?? "Unavailable"}</dd>
    </div>
  );
}

function renderPositionDrillDown(position: PositionSummary) {
  const detailFields: PositionDetailField[] = [
    { label: "Position", value: position.position_id },
    { label: "Instrument", value: position.instrument_id },
    { label: "Side", value: position.side },
    { label: "Quantity", value: position.quantity },
    { label: "Entry price", value: position.entry_price },
    { label: "Unrealized PnL", value: position.unrealized_pnl },
    { label: "Realized PnL", value: position.realized_pnl },
    { label: "Opened at", value: position.opened_at },
    { label: "Updated at", value: position.updated_at }
  ];

  return <dl className="resource-detail-grid">{detailFields.map(renderPositionDetailField)}</dl>;
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
  const query = useQuery({
    queryKey: adminQueryKeys.positions(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getPositionsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={POSITION_COLUMNS}
      emptyDescription="No positions are currently reported by the admin API."
      getRowKey={getPositionRowKey}
      loadingDescription="Loading the latest position diagnostics."
      pagination={{ pageSize: TRADING_PAGE_SIZE }}
      filter={{ getSearchText: getPositionSearchText }}
      query={query}
      tableLabel="Positions"
      title="Positions"
      drillDown={{
        title: "Position details",
        getButtonLabel: (position, _index, expanded) =>
          `${expanded ? "Hide" : "View"} details for ${position.instrument_id}`,
        render: renderPositionDrillDown
      }}
    />
  );
}
