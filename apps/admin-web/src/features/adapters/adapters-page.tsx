import { useQuery } from "@tanstack/react-query";

import { connectAdapterCommand, disconnectAdapterCommand, getAdaptersSnapshot } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AdapterSummary } from "../../shared/types/admin";
import { ConfirmCommandDialog } from "../commands/confirm-command-dialog";
import { CommandReceiptCard } from "../commands/command-receipt-card";
import { useCommandAction } from "../commands/use-command-action";
import { AdminListPage } from "../read-only/admin-list-page";
import { PageState } from "../../shared/ui/page-state";


export function AdaptersPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.adapters(),
    queryFn: getAdaptersSnapshot
  });
  const { activeIntent, actionError, receipt, isSubmitting, openIntent, closeIntent, confirmIntent } = useCommandAction();

  const columns = [
    {
      header: "Adapter",
      render: (adapter: AdapterSummary) => adapter.adapter_id
    },
    {
      header: "Status",
      render: (adapter: AdapterSummary) => adapter.status
    },
    {
      header: "Controls",
      render: (adapter: AdapterSummary) => (
        <div className="command-action-group">
          <button
            className="command-button"
            onClick={() =>
              openIntent({
                commandLabel: "Connect adapter",
                targetLabel: `adapters/${adapter.adapter_id}`,
                confirmationValue: "CONNECT",
                submit: () => connectAdapterCommand(adapter.adapter_id)
              })
            }
            type="button"
          >
            {`Connect adapter ${adapter.adapter_id}`}
          </button>
          <button
            className="command-button command-button-secondary"
            onClick={() =>
              openIntent({
                commandLabel: "Disconnect adapter",
                targetLabel: `adapters/${adapter.adapter_id}`,
                confirmationValue: "DISCONNECT",
                submit: () => disconnectAdapterCommand(adapter.adapter_id)
              })
            }
            type="button"
          >
            {`Disconnect adapter ${adapter.adapter_id}`}
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminListPage
        columns={columns}
        emptyDescription="No adapters are currently reported by the admin API."
        getRowKey={(adapter) => adapter.adapter_id}
        loadingDescription="Loading the latest adapter diagnostics."
        query={query}
        tableLabel="Adapters"
        title="Adapters"
      />
      {actionError ? <PageState kind="error" title="Command failed" description={actionError} /> : null}
      {receipt ? <CommandReceiptCard receipt={receipt} /> : null}
      <ConfirmCommandDialog
        commandLabel={activeIntent?.commandLabel ?? ""}
        confirmationValue={activeIntent?.confirmationValue ?? ""}
        isSubmitting={isSubmitting}
        onClose={closeIntent}
        onConfirm={() => {
          void confirmIntent();
        }}
        open={activeIntent != null}
        targetLabel={activeIntent?.targetLabel ?? ""}
      />
    </>
  );
}
