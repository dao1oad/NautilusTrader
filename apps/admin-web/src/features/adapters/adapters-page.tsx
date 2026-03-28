import { useQuery } from "@tanstack/react-query";

import { connectAdapterCommand, disconnectAdapterCommand, getAdaptersSnapshot } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { AdapterSummary } from "../../shared/types/admin";
import { ConfirmCommandDialog } from "../commands/confirm-command-dialog";
import { CommandReceiptCard } from "../commands/command-receipt-card";
import { useCommandAction } from "../commands/use-command-action";
import { AdminListPage } from "../read-only/admin-list-page";
import { PageState } from "../../shared/ui/page-state";


export function AdaptersPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.adapters(),
    queryFn: getAdaptersSnapshot
  });
  const { activeIntent, actionError, receipt, isSubmitting, openIntent, closeIntent, confirmIntent } = useCommandAction();

  const columns = [
    {
      header: t("pages.adapters.columns.adapter"),
      render: (adapter: AdapterSummary) => adapter.adapter_id
    },
    {
      header: t("pages.adapters.columns.status"),
      render: (adapter: AdapterSummary) => adapter.status
    },
    {
      header: t("pages.adapters.columns.controls"),
      render: (adapter: AdapterSummary) => (
        <div className="command-action-group">
          <button
            className="command-button"
            onClick={() =>
              openIntent({
                commandLabel: t("pages.adapters.commands.connect"),
                targetLabel: `adapters/${adapter.adapter_id}`,
                confirmationValue: "CONNECT",
                submit: () => connectAdapterCommand(adapter.adapter_id)
              })
            }
            type="button"
          >
            {t("pages.adapters.buttons.connect", { adapterId: adapter.adapter_id })}
          </button>
          <button
            className="command-button command-button-secondary"
            onClick={() =>
              openIntent({
                commandLabel: t("pages.adapters.commands.disconnect"),
                targetLabel: `adapters/${adapter.adapter_id}`,
                confirmationValue: "DISCONNECT",
                submit: () => disconnectAdapterCommand(adapter.adapter_id)
              })
            }
            type="button"
          >
            {t("pages.adapters.buttons.disconnect", { adapterId: adapter.adapter_id })}
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminListPage
        columns={columns}
        emptyDescription={t("pages.adapters.emptyDescription")}
        getRowKey={(adapter) => adapter.adapter_id}
        loadingDescription={t("pages.adapters.loadingDescription")}
        query={query}
        summaryCopy={t("pages.adapters.summaryCopy")}
        tableLabel={t("pages.adapters.tableLabel")}
        title={t("pages.adapters.title")}
      />
      {actionError ? <PageState kind="error" title={t("pages.adapters.actionErrorTitle")} description={actionError} /> : null}
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
