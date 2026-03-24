import { PageState } from "../../shared/ui/page-state";


export function OrdersRoutePage() {
  return (
    <PageState
      kind="empty"
      title="Orders"
      description="Orders remain read-only and will be connected once the trading surface DTOs arrive."
    />
  );
}
