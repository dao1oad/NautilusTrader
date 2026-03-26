import { useQuery } from "@tanstack/react-query";

import { getStrategiesSnapshot, startStrategyCommand, stopStrategyCommand } from "../../shared/api/admin-client";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { StrategySummary } from "../../shared/types/admin";
import { ConfirmCommandDialog } from "../commands/confirm-command-dialog";
import { CommandReceiptCard } from "../commands/command-receipt-card";
import { useCommandAction } from "../commands/use-command-action";
import { AdminListPage } from "../read-only/admin-list-page";
import { PageState } from "../../shared/ui/page-state";


export function StrategiesPage() {
  const query = useQuery({
    queryKey: adminQueryKeys.strategies(),
    queryFn: getStrategiesSnapshot
  });
  const { activeIntent, actionError, receipt, isSubmitting, openIntent, closeIntent, confirmIntent } = useCommandAction();

  const columns = [
    {
      header: "Strategy",
      render: (strategy: StrategySummary) => strategy.strategy_id
    },
    {
      header: "Status",
      render: (strategy: StrategySummary) => strategy.status
    },
    {
      header: "Controls",
      render: (strategy: StrategySummary) => (
        <div className="command-action-group">
          <button
            className="command-button"
            onClick={() =>
              openIntent({
                commandLabel: "Start strategy",
                targetLabel: `strategies/${strategy.strategy_id}`,
                confirmationValue: "START",
                submit: () => startStrategyCommand(strategy.strategy_id)
              })
            }
            type="button"
          >
            {`Start strategy ${strategy.strategy_id}`}
          </button>
          <button
            className="command-button command-button-secondary"
            onClick={() =>
              openIntent({
                commandLabel: "Stop strategy",
                targetLabel: `strategies/${strategy.strategy_id}`,
                confirmationValue: "STOP",
                submit: () => stopStrategyCommand(strategy.strategy_id)
              })
            }
            type="button"
          >
            {`Stop strategy ${strategy.strategy_id}`}
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminListPage
        columns={columns}
        emptyDescription="No strategies are currently reported by the admin API."
        getRowKey={(strategy) => strategy.strategy_id}
        loadingDescription="Loading the latest strategy diagnostics."
        query={query}
        tableLabel="Strategies"
        title="Strategies"
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
