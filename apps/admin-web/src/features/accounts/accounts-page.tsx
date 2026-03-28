import { useQuery } from "@tanstack/react-query";

import { getAccountsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AccountSummary } from "../../shared/types/admin";
import type { AccountsSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


type AccountsTranslator = ReturnType<typeof useI18n>["t"];

function buildAccountColumns(t: AccountsTranslator) {
  return [
    {
      header: t("pages.accounts.columns.account"),
      render: (account: AccountSummary) => account.account_id
    },
    {
      header: t("pages.accounts.columns.status"),
      render: (account: AccountSummary) => account.status
    },
    {
      header: t("pages.accounts.columns.venue"),
      render: (account: AccountSummary) => account.venue ?? t("pages.accounts.fallbackNA")
    },
    {
      header: t("pages.accounts.columns.equity"),
      render: (account: AccountSummary) => account.total_equity ?? t("pages.accounts.fallbackNA")
    },
    {
      header: t("pages.accounts.columns.marginRatio"),
      render: (account: AccountSummary) => account.margin_ratio ?? t("pages.accounts.fallbackNA")
    },
    {
      header: t("pages.accounts.columns.netExposure"),
      render: (account: AccountSummary) => account.net_exposure ?? t("pages.accounts.fallbackNA")
    }
  ] as const;
}

function buildAccountSummaryFields(t: AccountsTranslator): Array<{ label: string; getValue: (summary: AccountsSummary) => string }> {
  return [
    { label: t("pages.accounts.summaryFields.totalEquity"), getValue: (summary) => summary.total_equity },
    { label: t("pages.accounts.summaryFields.availableCash"), getValue: (summary) => summary.available_cash },
    { label: t("pages.accounts.summaryFields.marginUsed"), getValue: (summary) => summary.margin_used },
    { label: t("pages.accounts.summaryFields.marginAvailable"), getValue: (summary) => summary.margin_available },
    { label: t("pages.accounts.summaryFields.grossExposure"), getValue: (summary) => summary.gross_exposure },
    { label: t("pages.accounts.summaryFields.netExposure"), getValue: (summary) => summary.net_exposure }
  ];
}

function AccountsSummaryGrid({ summary, t }: { summary: AccountsSummary; t: AccountsTranslator }) {
  return (
    <div aria-label={t("pages.accounts.summaryAriaLabel")} className="metric-grid">
      {buildAccountSummaryFields(t).map((field) => (
        <article className="metric-card" key={field.label}>
          <p className="metric-label">{field.label}</p>
          <p className="metric-value">{field.getValue(summary)}</p>
        </article>
      ))}
    </div>
  );
}

function renderAccountDetails(account: AccountSummary, t: AccountsTranslator) {
  const fallbackNA = t("pages.accounts.fallbackNA");

  return (
    <div className="detail-stack">
      <dl className="resource-detail-grid">
        <div>
          <dt>{t("pages.accounts.details.venue")}</dt>
          <dd>{account.venue ?? fallbackNA}</dd>
        </div>
        <div>
          <dt>{t("pages.accounts.details.type")}</dt>
          <dd>{account.account_type ?? fallbackNA}</dd>
        </div>
        <div>
          <dt>{t("pages.accounts.details.baseCurrency")}</dt>
          <dd>{account.base_currency ?? fallbackNA}</dd>
        </div>
        <div>
          <dt>{t("pages.accounts.details.availableCash")}</dt>
          <dd>{account.available_cash ?? fallbackNA}</dd>
        </div>
        <div>
          <dt>{t("pages.accounts.details.marginUsed")}</dt>
          <dd>{account.margin_used ?? fallbackNA}</dd>
        </div>
        <div>
          <dt>{t("pages.accounts.details.updatedAt")}</dt>
          <dd>{account.updated_at ?? fallbackNA}</dd>
        </div>
      </dl>

      <section className="detail-section">
        <h4>{t("pages.accounts.sections.balances")}</h4>
        <table aria-label={t("pages.accounts.balancesTable.ariaLabel", { accountId: account.account_id })} className="resource-table">
          <thead>
            <tr>
              <th scope="col">{t("pages.accounts.balancesTable.asset")}</th>
              <th scope="col">{t("pages.accounts.balancesTable.total")}</th>
              <th scope="col">{t("pages.accounts.balancesTable.available")}</th>
              <th scope="col">{t("pages.accounts.balancesTable.locked")}</th>
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
        <h4>{t("pages.accounts.sections.exposure")}</h4>
        <table aria-label={t("pages.accounts.exposureTable.ariaLabel", { accountId: account.account_id })} className="resource-table">
          <thead>
            <tr>
              <th scope="col">{t("pages.accounts.exposureTable.instrument")}</th>
              <th scope="col">{t("pages.accounts.exposureTable.side")}</th>
              <th scope="col">{t("pages.accounts.exposureTable.netQuantity")}</th>
              <th scope="col">{t("pages.accounts.exposureTable.notional")}</th>
              <th scope="col">{t("pages.accounts.exposureTable.leverage")}</th>
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
          <h4>{t("pages.accounts.sections.alerts")}</h4>
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
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.accounts(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getAccountsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={buildAccountColumns(t)}
      drillDown={{
        title: t("pages.accounts.drillDownTitle"),
        getButtonLabel: (account, _index, expanded) =>
          t(expanded ? "pages.accounts.hideDetails" : "pages.accounts.viewDetails", {
            accountId: account.account_id
          }),
        render: (account) => renderAccountDetails(account, t)
      }}
      emptyDescription={t("pages.accounts.emptyDescription")}
      getRowKey={(account) => account.account_id}
      loadingDescription={t("pages.accounts.loadingDescription")}
      query={query}
      summaryCopy={t("pages.accounts.summaryCopy")}
      summary={query.data ? <AccountsSummaryGrid summary={query.data.summary} t={t} /> : null}
      tableLabel={t("pages.accounts.tableLabel")}
      title={t("pages.accounts.title")}
    />
  );
}
