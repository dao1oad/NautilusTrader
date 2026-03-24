import { PageState } from "../../shared/ui/page-state";


export function LogsRoutePage() {
  return (
    <PageState
      kind="empty"
      title="Logs"
      description="Operational logs stay read-only and will be wired up once the log aggregation API is in place."
    />
  );
}
