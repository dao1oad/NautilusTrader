import { useQuery } from "@tanstack/react-query";

import { useWorkbenchShellMeta } from "../../app/workbench-shell-meta";
import {
  CATALOG_DEFAULT_END_TIME,
  CATALOG_DEFAULT_START_TIME,
  getCatalogSnapshot,
  READ_ONLY_DEFAULT_LIMIT
} from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { CatalogEntry, CatalogSnapshot } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const CATALOG_PAGE_SIZE = 25;
const CATALOG_COPY =
  "Bounded catalog browse windows, query feedback, and operator notes for analysis workbench datasets.";

const CATALOG_COLUMNS = [
  {
    header: "Catalog",
    render: (entry: CatalogEntry) => entry.catalog_id
  },
  {
    header: "Instrument",
    render: (entry: CatalogEntry) => entry.instrument_id
  },
  {
    header: "Type",
    render: (entry: CatalogEntry) => entry.data_type
  },
  {
    header: "Timeframe",
    render: (entry: CatalogEntry) => entry.timeframe
  },
  {
    header: "Rows",
    render: (entry: CatalogEntry) => entry.row_count.toLocaleString()
  },
  {
    header: "Status",
    render: (entry: CatalogEntry) => entry.status
  }
] as const;


function getCatalogSearchText(entry: CatalogEntry) {
  return [
    entry.catalog_id,
    entry.instrument_id,
    entry.data_type,
    entry.timeframe,
    entry.status
  ].join(" ");
}


function renderCatalogDetails(entry: CatalogEntry) {
  return (
    <dl className="resource-detail-grid">
      <div>
        <dt>Catalog</dt>
        <dd>{entry.catalog_id}</dd>
      </div>
      <div>
        <dt>Instrument</dt>
        <dd>{entry.instrument_id}</dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>{entry.data_type}</dd>
      </div>
      <div>
        <dt>Timeframe</dt>
        <dd>{entry.timeframe}</dd>
      </div>
      <div>
        <dt>First record</dt>
        <dd>{entry.first_record_at}</dd>
      </div>
      <div>
        <dt>Last record</dt>
        <dd>{entry.last_record_at}</dd>
      </div>
    </dl>
  );
}


function CatalogSummaryCard({ snapshot }: { snapshot: CatalogSnapshot }) {
  const { history_query: historyQuery } = snapshot;

  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>Catalog</dt>
          <dd>{historyQuery.catalog_id}</dd>
        </div>
        <div>
          <dt>Instrument</dt>
          <dd>{historyQuery.instrument_id}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{historyQuery.data_type}</dd>
        </div>
        <div>
          <dt>Window</dt>
          <dd>{`${historyQuery.start_time} to ${historyQuery.end_time}`}</dd>
        </div>
        <div>
          <dt>Limit</dt>
          <dd>{historyQuery.limit}</dd>
        </div>
        <div>
          <dt>Returned rows</dt>
          <dd>{historyQuery.returned_rows}</dd>
        </div>
      </dl>

      <section className="detail-section">
        <h4>History query feedback</h4>
        <p className="command-receipt-copy">{historyQuery.feedback}</p>
      </section>

      <section className="detail-section">
        <h4>Operator feedback</h4>
        <ul className="detail-list">
          {snapshot.operator_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function buildCatalogStatusSummary(snapshot: CatalogSnapshot | null) {
  if (!snapshot) {
    return "Awaiting bounded catalog browse telemetry.";
  }

  return `${snapshot.items.length} datasets projected; ${snapshot.history_query.returned_rows} rows returned within the bounded query window.`;
}


export function CatalogPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.catalog(READ_ONLY_DEFAULT_LIMIT, CATALOG_DEFAULT_START_TIME, CATALOG_DEFAULT_END_TIME),
    queryFn: () => getCatalogSnapshot(READ_ONLY_DEFAULT_LIMIT, CATALOG_DEFAULT_START_TIME, CATALOG_DEFAULT_END_TIME)
  });

  useWorkbenchShellMeta({
    lastUpdated: query.data?.generated_at ?? null,
    pageTitle: "Catalog",
    priority: 2,
    statusSummary: buildCatalogStatusSummary(query.data ?? null),
    workbenchCopy: CATALOG_COPY
  });

  return (
    <AdminListPage
      columns={CATALOG_COLUMNS}
      drillDown={{
        title: "Catalog entry details",
        getButtonLabel: (entry, _index, expanded) =>
          `${expanded ? "Hide" : "View"} details for ${entry.instrument_id} in ${entry.catalog_id}`,
        render: renderCatalogDetails
      }}
      emptyDescription="No catalog datasets are currently projected by the admin API."
      filter={{ getSearchText: getCatalogSearchText }}
      getRowKey={(entry) => `${entry.catalog_id}:${entry.instrument_id}:${entry.data_type}:${entry.timeframe}`}
      header={{
        eyebrow: "Analysis workbench",
        summary: buildCatalogStatusSummary(query.data ?? null)
      }}
      loadingDescription="Loading the latest catalog and history diagnostics."
      pagination={{ pageSize: CATALOG_PAGE_SIZE }}
      query={query}
      surface={{
        description: "History query feedback, operator notes, and bounded catalog rows for the selected UTC analysis window.",
        eyebrow: "Catalog browse window",
        title: "Bounded browse window"
      }}
      summaryCopy={CATALOG_COPY}
      summary={query.data ? <CatalogSummaryCard snapshot={query.data} /> : null}
      tableLabel="Catalog entries"
      title="Catalog"
    />
  );
}
