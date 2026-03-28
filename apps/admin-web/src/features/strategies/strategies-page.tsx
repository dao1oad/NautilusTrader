import { useQuery } from "@tanstack/react-query";

import { getStrategiesSnapshot, startStrategyCommand, stopStrategyCommand } from "../../shared/api/admin-client";
import { useI18n } from "../../shared/i18n/use-i18n";
import { adminQueryKeys } from "../../shared/query/query-client";
import type { StrategySummary } from "../../shared/types/admin";
import { ConfirmCommandDialog } from "../commands/confirm-command-dialog";
import { CommandReceiptCard } from "../commands/command-receipt-card";
import { useCommandAction } from "../commands/use-command-action";
import { AdminListPage } from "../read-only/admin-list-page";
import { PageState } from "../../shared/ui/page-state";


export function StrategiesPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: adminQueryKeys.strategies(),
    queryFn: getStrategiesSnapshot
  });
  const { activeIntent, actionError, receipt, isSubmitting, openIntent, closeIntent, confirmIntent } = useCommandAction();

  const columns = [
    {
      header: t("pages.strategies.columns.strategy"),
      render: (strategy: StrategySummary) => strategy.strategy_id
    },
    {
      header: t("pages.strategies.columns.status"),
      render: (strategy: StrategySummary) => strategy.status
    },
    {
      header: t("pages.strategies.columns.controls"),
      render: (strategy: StrategySummary) => (
        <div className="command-action-group">
          <button
            className="command-button"
            onClick={() =>
              openIntent({
                commandLabel: t("pages.strategies.commands.start"),
                targetLabel: `strategies/${strategy.strategy_id}`,
                confirmationValue: "START",
                submit: () => startStrategyCommand(strategy.strategy_id)
              })
            }
            type="button"
          >
            {t("pages.strategies.buttons.start", { strategyId: strategy.strategy_id })}
          </button>
          <button
            className="command-button command-button-secondary"
            onClick={() =>
              openIntent({
                commandLabel: t("pages.strategies.commands.stop"),
                targetLabel: `strategies/${strategy.strategy_id}`,
                confirmationValue: "STOP",
                submit: () => stopStrategyCommand(strategy.strategy_id)
              })
            }
            type="button"
          >
            {t("pages.strategies.buttons.stop", { strategyId: strategy.strategy_id })}
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminListPage
        columns={columns}
        emptyDescription={t("pages.strategies.emptyDescription")}
        getRowKey={(strategy) => strategy.strategy_id}
        loadingDescription={t("pages.strategies.loadingDescription")}
        query={query}
        summaryCopy={t("pages.strategies.summaryCopy")}
        tableLabel={t("pages.strategies.tableLabel")}
        title={t("pages.strategies.title")}
      />
      {actionError ? <PageState kind="error" title={t("pages.strategies.actionErrorTitle")} description={actionError} /> : null}
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
