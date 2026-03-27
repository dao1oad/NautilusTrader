import { useQuery } from "@tanstack/react-query";

import { getAccountsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AccountSummary } from "../../shared/types/admin";
import type { AccountsSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const ACCOUNT_COLUMNS = [
  {
    header: "Account",
    render: (account: AccountSummary) => account.account_id
  },
  {
    header: "Status",
    render: (account: AccountSummary) => account.status
  },
  {
    header: "Venue",
    render: (account: AccountSummary) => account.venue ?? "n/a"
  },
  {
    header: "Equity",
    render: (account: AccountSummary) => account.total_equity ?? "n/a"
  },
  {
    header: "Margin ratio",
    render: (account: AccountSummary) => account.margin_ratio ?? "n/a"
  },
  {
    header: "Net exposure",
    render: (account: AccountSummary) => account.net_exposure ?? "n/a"
  }
] as const;

const SUMMARY_FIELDS: Array<{ label: string; getValue: (summary: AccountsSummary) => string }> = [
  { label: "Total equity", getValue: (summary) => summary.total_equity },
  { label: "Available cash", getValue: (summary) => summary.available_cash },
  { label: "Margin used", getValue: (summary) => summary.margin_used },
  { label: "Margin available", getValue: (summary) => summary.margin_available },
  { label: "Gross exposure", getValue: (summary) => summary.gross_exposure },
  { label: "Net exposure", getValue: (summary) => summary.net_exposure }
];


function AccountsSummaryGrid({ summary }: { summary: AccountsSummary }) {
  return (
    <div aria-label="Account summary" className="metric-grid">
      {SUMMARY_FIELDS.map((field) => (
        <article className="metric-card" key={field.label}>
          <p className="metric-label">{field.label}</p>
          <p className="metric-value">{field.getValue(summary)}</p>
        </article>
      ))}
    </div>
  );
}


function renderAccountDetails(account: AccountSummary) {
  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>Venue</dt>
          <dd>{account.venue ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{account.account_type ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Base currency</dt>
          <dd>{account.base_currency ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Available cash</dt>
          <dd>{account.available_cash ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Margin used</dt>
          <dd>{account.margin_used ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Updated at</dt>
          <dd>{account.updated_at ?? "n/a"}</dd>
        </div>
      </dl>

      <section className="detail-section">
        <h4>Balances</h4>
        <table aria-label={`Balances for ${account.account_id}`} className="resource-table">
          <thead>
            <tr>
              <th scope="col">Asset</th>
              <th scope="col">Total</th>
              <th scope="col">Available</th>
              <th scope="col">Locked</th>
            </tr>
          </thead>
          <tbody>
            {account.balances.map((balance) => (
              <tr key={`${account.account_id}:${balance.asset}`}>
                <td>{balance.asset}</td>
                <td>{balance.total}</td>
                <td>{balance.available}</td>
                <td>{balance.locked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="detail-section">
        <h4>Exposure</h4>
        <table aria-label={`Exposure for ${account.account_id}`} className="resource-table">
          <thead>
            <tr>
              <th scope="col">Instrument</th>
              <th scope="col">Side</th>
              <th scope="col">Net quantity</th>
              <th scope="col">Notional</th>
              <th scope="col">Leverage</th>
            </tr>
          </thead>
          <tbody>
            {account.exposures.map((exposure) => (
              <tr key={`${account.account_id}:${exposure.instrument_id}`}>
                <td>{exposure.instrument_id}</td>
                <td>{exposure.side}</td>
                <td>{exposure.net_quantity}</td>
                <td>{exposure.notional}</td>
                <td>{exposure.leverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {account.alerts.length > 0 ? (
        <section className="detail-section">
          <h4>Alerts</h4>
          <ul className="detail-list">
            {account.alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}


export function AccountsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.accounts(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getAccountsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={ACCOUNT_COLUMNS}
      drillDown={{
        title: "Account details",
        getButtonLabel: (account, _index, expanded) =>
          `${expanded ? "Hide" : "View"} details for ${account.account_id}`,
        render: renderAccountDetails
      }}
      emptyDescription="No accounts are currently reported by the admin API."
      getRowKey={(account) => account.account_id}
      loadingDescription="Loading the latest account diagnostics."
      query={query}
      summary={query.data ? <AccountsSummaryGrid summary={query.data.summary} /> : null}
      tableLabel="Accounts"
      title="Accounts"
    />
  );
}
