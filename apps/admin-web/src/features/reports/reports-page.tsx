import { useQuery } from "@tanstack/react-query";

import { getReportsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { ReportSummary, ReportsSnapshot } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const REPORTS_PAGE_SIZE = 25;

const REPORTS_COLUMNS = [
  {
    header: "Report",
    render: (report: ReportSummary) => report.report_id
  },
  {
    header: "Strategy",
    render: (report: ReportSummary) => report.strategy_id
  },
  {
    header: "Instrument",
    render: (report: ReportSummary) => report.instrument_id
  },
  {
    header: "Net PnL",
    render: (report: ReportSummary) => report.net_pnl
  },
  {
    header: "Return",
    render: (report: ReportSummary) => report.return_pct
  },
  {
    header: "Sharpe",
    render: (report: ReportSummary) => report.sharpe_ratio
  },
  {
    header: "Summary",
    render: (report: ReportSummary) => report.summary
  }
] as const;


function getReportSearchText(report: ReportSummary) {
  return [
    report.report_id,
    report.run_id,
    report.strategy_id,
    report.instrument_id,
    report.net_pnl,
    report.return_pct,
    report.summary,
    ...report.artifacts
  ].join(" ");
}


function renderReportDetails(report: ReportSummary) {
  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>Report</dt>
          <dd>{report.report_id}</dd>
        </div>
        <div>
          <dt>Run</dt>
          <dd>{report.run_id}</dd>
        </div>
        <div>
          <dt>Generated</dt>
          <dd>{report.generated_at}</dd>
        </div>
        <div>
          <dt>Max drawdown</dt>
          <dd>{report.max_drawdown}</dd>
        </div>
        <div>
          <dt>Win rate</dt>
          <dd>{report.win_rate}</dd>
        </div>
      </dl>
      <section className="detail-section">
        <h4>Available artifacts</h4>
        <ul className="detail-list">
          {report.artifacts.map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}


function ReportsSummaryCard({ snapshot }: { snapshot: ReportsSnapshot }) {
  const profitableReports = snapshot.items.filter((report) => report.net_pnl.startsWith("+")).length;

  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>Visible reports</dt>
          <dd>{snapshot.items.length}</dd>
        </div>
        <div>
          <dt>Profitable</dt>
          <dd>{profitableReports}</dd>
        </div>
        <div>
          <dt>Artifact families</dt>
          <dd>{new Set(snapshot.items.flatMap((report) => report.artifacts)).size}</dd>
        </div>
      </dl>
      <section className="detail-section">
        <h4>Analysis scope</h4>
        <p className="command-receipt-copy">Review bounded performance summaries and linked report families for completed backtest runs.</p>
      </section>
    </div>
  );
}


export function ReportsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.reports(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getReportsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={REPORTS_COLUMNS}
      drillDown={{
        title: "Report details",
        getButtonLabel: (report, _index, expanded) =>
          `${expanded ? "Hide" : "View"} details for report ${report.report_id}`,
        render: renderReportDetails
      }}
      emptyDescription="No report summaries are currently projected by the admin API."
      filter={{ getSearchText: getReportSearchText }}
      getRowKey={(report) => report.report_id}
      loadingDescription="Loading bounded report summaries."
      pagination={{ pageSize: REPORTS_PAGE_SIZE }}
      query={query}
      summary={query.data ? <ReportsSummaryCard snapshot={query.data} /> : null}
      tableLabel="Report summaries"
      title="Reports"
    />
  );
}
