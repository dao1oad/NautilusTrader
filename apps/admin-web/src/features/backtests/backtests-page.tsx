import { useQuery } from "@tanstack/react-query";

import { getBacktestsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { BacktestTaskSummary, BacktestsSnapshot } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const BACKTESTS_PAGE_SIZE = 25;

const BACKTESTS_COLUMNS = [
  {
    header: "Task",
    render: (task: BacktestTaskSummary) => task.task_id
  },
  {
    header: "Strategy",
    render: (task: BacktestTaskSummary) => task.strategy_id
  },
  {
    header: "Instrument",
    render: (task: BacktestTaskSummary) => task.instrument_id
  },
  {
    header: "Status",
    render: (task: BacktestTaskSummary) => task.status
  },
  {
    header: "Progress",
    render: (task: BacktestTaskSummary) => `${task.progress_pct}%`
  },
  {
    header: "Report",
    render: (task: BacktestTaskSummary) => task.report_id ?? "Pending"
  },
  {
    header: "Result",
    render: (task: BacktestTaskSummary) => task.result_summary
  }
] as const;


function getBacktestSearchText(task: BacktestTaskSummary) {
  return [
    task.task_id,
    task.run_id,
    task.strategy_id,
    task.catalog_id,
    task.instrument_id,
    task.status,
    task.report_id ?? ""
  ].join(" ");
}


function renderBacktestDetails(task: BacktestTaskSummary) {
  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>Task</dt>
          <dd>{task.task_id}</dd>
        </div>
        <div>
          <dt>Run</dt>
          <dd>{task.run_id}</dd>
        </div>
        <div>
          <dt>Catalog</dt>
          <dd>{task.catalog_id}</dd>
        </div>
        <div>
          <dt>Instrument</dt>
          <dd>{task.instrument_id}</dd>
        </div>
        <div>
          <dt>Requested</dt>
          <dd>{task.requested_at}</dd>
        </div>
        <div>
          <dt>Finished</dt>
          <dd>{task.finished_at ?? "In progress"}</dd>
        </div>
      </dl>
      <section className="detail-section">
        <h4>Operator context</h4>
        <p className="command-receipt-copy">{task.result_summary}</p>
      </section>
    </div>
  );
}


function BacktestsSummaryCard({ snapshot }: { snapshot: BacktestsSnapshot }) {
  const completedTasks = snapshot.items.filter((task) => task.status === "completed").length;
  const runningTasks = snapshot.items.filter((task) => task.status === "running").length;
  const linkedReports = snapshot.items.filter((task) => task.report_id != null).length;

  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>Visible tasks</dt>
          <dd>{snapshot.items.length}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{completedTasks}</dd>
        </div>
        <div>
          <dt>Running</dt>
          <dd>{runningTasks}</dd>
        </div>
        <div>
          <dt>Linked reports</dt>
          <dd>{linkedReports}</dd>
        </div>
      </dl>
      <section className="detail-section">
        <h4>Phase 4A scope</h4>
        <p className="command-receipt-copy">Browse bounded backtest runs and their linked result summaries without expanding into a strategy editor.</p>
      </section>
    </div>
  );
}


export function BacktestsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.backtests(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getBacktestsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={BACKTESTS_COLUMNS}
      drillDown={{
        title: "Backtest task details",
        getButtonLabel: (task, _index, expanded) =>
          `${expanded ? "Hide" : "View"} details for backtest task ${task.task_id}`,
        render: renderBacktestDetails
      }}
      emptyDescription="No backtest tasks are currently projected by the admin API."
      filter={{
        getSearchText: getBacktestSearchText,
        placeholder: "Filter by task, run, strategy, catalog, instrument, or report id"
      }}
      getRowKey={(task) => task.task_id}
      loadingDescription="Loading bounded backtest task history."
      pagination={{ pageSize: BACKTESTS_PAGE_SIZE }}
      query={query}
      summaryCopy="Bounded backtest task history, operator-ready run status, and linked report hand-off points."
      summary={query.data ? <BacktestsSummaryCard snapshot={query.data} /> : null}
      tableLabel="Backtest tasks"
      title="Backtests"
    />
  );
}
