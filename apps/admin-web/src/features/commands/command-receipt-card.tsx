import type { CommandReceipt } from "../../shared/types/admin";
import { useI18n } from "../../shared/i18n/use-i18n";
import { LastUpdatedBadge } from "../../shared/ui/last-updated-badge";


type Props = {
  receipt: CommandReceipt;
};


export function CommandReceiptCard({ receipt }: Props) {
  const { t } = useI18n();

  return (
    <section className="command-receipt-card">
      <div className="resource-header">
        <div>
          <p className="page-state-kicker">{t("commands.latestReceipt")}</p>
          <h2>{receipt.command}</h2>
          <p className="command-receipt-copy">{receipt.target}</p>
        </div>
        <LastUpdatedBadge stale={receipt.status === "failed"} timestamp={receipt.recorded_at} />
      </div>
      <p className="command-receipt-status" data-status={receipt.status}>
        {receipt.status}
      </p>
      {receipt.message ? <p className="command-receipt-copy">{receipt.message}</p> : null}
      {receipt.failure ? <p className="command-receipt-copy">{receipt.failure.message}</p> : null}
    </section>
  );
}
