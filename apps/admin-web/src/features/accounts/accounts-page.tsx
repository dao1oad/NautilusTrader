import { useQuery } from "@tanstack/react-query";

import { getAccountsSnapshot, READ_ONLY_DEFAULT_LIMIT } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AccountSummary } from "../../shared/types/admin";
import { AdminListPage } from "../read-only/admin-list-page";


const ACCOUNT_COLUMNS = [
  {
    header: "Account",
    render: (account: AccountSummary) => account.account_id
  },
  {
    header: "Status",
    render: (account: AccountSummary) => account.status
  }
] as const;

export function AccountsPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.accounts(READ_ONLY_DEFAULT_LIMIT),
    queryFn: () => getAccountsSnapshot(READ_ONLY_DEFAULT_LIMIT)
  });

  return (
    <AdminListPage
      columns={ACCOUNT_COLUMNS}
      emptyDescription="No accounts are currently reported by the admin API."
      getRowKey={(account) => account.account_id}
      loadingDescription="Loading the latest account diagnostics."
      query={query}
      tableLabel="Accounts"
      title="Accounts"
    />
  );
}
